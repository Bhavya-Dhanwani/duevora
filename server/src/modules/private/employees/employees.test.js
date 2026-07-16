import { jest } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

// Mock sending mail
jest.unstable_mockModule("../../../shared/utils/sendMail.util.js", () => ({
    __esModule: true,
    default: jest.fn(),
}));

const { default: createApp } = await import("../../../app.js");
const { default: User } = await import("../../../shared/models/user.model.js");
const { default: Organization } = await import("../../../shared/models/organization.model.js");
const { default: Employee } = await import("../../../shared/models/employee.model.js");
const { default: Role } = await import("../../../shared/models/role.model.js");
const { default: Permission } = await import("../../../shared/models/permission.model.js");
const { default: Token } = await import("../../../shared/models/token.model.js");

let mongoServer;
let app;
let adminUserToken;
let orgId;
let adminRoleId;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    app = createApp();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }

    // Setup: Create a permission
    const invitePerm = await Permission.create({
        name: "Create Employee",
        code: "EMPLOYEES.CREATE",
        module: "employees"
    });

    // Create a User
    const adminUser = await User.create({
        name: "Admin User",
        email: "admin@example.com",
        password: "password123",
        isVerified: true
    });

    // Onboard Organization (which sets up Employee, Role, and binds permissions)
    const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: "admin@example.com", password: "password123" });
    
    const token = loginRes.body.data.accessToken;

    const onboardRes = await request(app)
        .post("/api/organization")
        .set("Authorization", `Bearer ${token}`)
        .send({
            name: "Inc Corp",
            code: "INC",
            firstName: "Admin",
            lastName: "Manager"
        });

    adminUserToken = onboardRes.body.data.accessToken;
    orgId = onboardRes.body.data.organization._id;

    // Get the employee role ID
    const role = await Role.findOne({ organizationId: orgId, code: "EMPLOYEE" });
    adminRoleId = role._id;
});

describe("Employee Member Invitation Integration Tests", () => {

    describe("POST /api/employees/invite", () => {
        it("should successfully generate an invitation token and send mail", async () => {
            const res = await request(app)
                .post("/api/employees/invite")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    email: "invitee@example.com",
                    roleId: adminRoleId
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.token).toBeDefined();
            expect(res.body.data.inviteUrl).toContain(res.body.data.token);
            expect(res.body.data.email).toBe("invitee@example.com");

            // Verify token is in database
            const dbToken = await Token.findOne({ email: "invitee@example.com", type: "invitation" });
            expect(dbToken).toBeDefined();
            expect(dbToken.roleId.toString()).toBe(adminRoleId.toString());
            expect(dbToken.organizationId.toString()).toBe(orgId.toString());
        });

        it("should fail validation if email is invalid", async () => {
            const res = await request(app)
                .post("/api/employees/invite")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    email: "bad-email",
                    roleId: adminRoleId
                });

            expect(res.status).toBe(400);
        });

        it("should fail if roleId is from another organization", async () => {
            const foreignOrg = await Organization.create({ name: "Foreign", code: "FRGN" });
            const foreignRole = await Role.create({ name: "Foreign Role", code: "FR", organizationId: foreignOrg._id });

            const res = await request(app)
                .post("/api/employees/invite")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    email: "invitee@example.com",
                    roleId: foreignRole._id
                });

            expect(res.status).toBe(404);
        });
    });

    describe("POST /api/auth/signup (with invitation token)", () => {
        it("should successfully sign up a user using an invitation token", async () => {
            // Setup: Create invitation token
            const tokenVal = "invitetoken123";
            await Token.create({
                email: "member@example.com",
                type: "invitation",
                value: tokenVal,
                roleId: adminRoleId,
                organizationId: orgId,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000)
            });

            const signupPayload = {
                name: "New Member",
                email: "member@example.com",
                password: "securepassword",
                confirmPassword: "securepassword",
                token: tokenVal
            };

            const res = await request(app)
                .post("/api/auth/signup")
                .send(signupPayload);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.employee).toBeDefined();
            expect(res.body.data.employee.firstName).toBe("New");
            expect(res.body.data.employee.lastName).toBe("Member");
            expect(res.body.data.accessToken).toBeDefined();

            // Verify token was deleted
            const dbToken = await Token.findOne({ value: tokenVal });
            expect(dbToken).toBeNull();

            // Verify employee profile was created
            const employee = await Employee.findOne({ email: "member@example.com" });
            expect(employee).toBeDefined();
            expect(employee.organizationId.toString()).toBe(orgId.toString());
        });

        it("should fail if email does not match invitation email", async () => {
            const tokenVal = "invitetoken123";
            await Token.create({
                email: "member@example.com",
                type: "invitation",
                value: tokenVal,
                roleId: adminRoleId,
                organizationId: orgId,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000)
            });

            const res = await request(app)
                .post("/api/auth/signup")
                .send({
                    name: "New Member",
                    email: "wrongemail@example.com",
                    password: "securepassword",
                    confirmPassword: "securepassword",
                    token: tokenVal
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain("Email does not match invitation");
        });
    });

});
