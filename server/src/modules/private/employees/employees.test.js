import { jest } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
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
const { default: Department } = await import("../../../shared/models/department.model.js");

let mongoServer;
let app;
let adminUserToken;
let orgId;
let adminRoleId;

beforeAll(async () => {
    // MongoMemoryReplSet is required to support multi-document transactions in tests
    mongoServer = await MongoMemoryReplSet.create({
        replSet: {
            storageEngine: "wiredTiger"
        }
    });
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

describe("Employee Member Invitation & Creation Integration Tests", () => {

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

        it("should successfully generate a generic invitation token when email is not provided", async () => {
            const res = await request(app)
                .post("/api/employees/invite")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    roleId: adminRoleId
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.token).toBeDefined();
            expect(res.body.data.inviteUrl).toContain(res.body.data.token);
            expect(res.body.data.email).toBeUndefined();

            // Verify token is in database with no email
            const dbToken = await Token.findOne({ value: res.body.data.token, type: "invitation" });
            expect(dbToken).toBeDefined();
            expect(dbToken.email).toBeUndefined();
            expect(dbToken.roleId.toString()).toBe(adminRoleId.toString());
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

        it("should successfully sign up a user using a generic invitation token (without associated email)", async () => {
            // Setup: Create invitation token with no email
            const tokenVal = "generictoken123";
            await Token.create({
                type: "invitation",
                value: tokenVal,
                roleId: adminRoleId,
                organizationId: orgId,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000)
            });

            const signupPayload = {
                name: "Generic Member",
                email: "generic@example.com",
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
            expect(res.body.data.employee.firstName).toBe("Generic");
            expect(res.body.data.employee.lastName).toBe("Member");
            expect(res.body.data.accessToken).toBeDefined();

            // Verify token was deleted
            const dbToken = await Token.findOne({ value: tokenVal });
            expect(dbToken).toBeNull();

            // Verify employee profile was created
            const employee = await Employee.findOne({ email: "generic@example.com" });
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

    describe("POST /api/auth/login (with invitation token)", () => {
        it("should successfully log in an existing user using an invitation token and assign organization / role", async () => {
            const { default: EmployeeRole } = await import("../../../shared/models/employeeRole.model.js");

            // Setup: Create an existing user first
            const existingUserEmail = "existinguser@example.com";
            const existingUserPassword = "securepassword";
            await User.create({
                name: "Existing User",
                email: existingUserEmail,
                password: existingUserPassword,
                isVerified: true
            });

            // Setup: Create invitation token
            const tokenVal = "logininvitetoken123";
            await Token.create({
                email: existingUserEmail,
                type: "invitation",
                value: tokenVal,
                roleId: adminRoleId,
                organizationId: orgId,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000)
            });

            const loginPayload = {
                email: existingUserEmail,
                password: existingUserPassword,
                token: tokenVal
            };

            const res = await request(app)
                .post("/api/auth/login")
                .send(loginPayload);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.accessToken).toBeDefined();

            // Verify token was deleted
            const dbToken = await Token.findOne({ value: tokenVal });
            expect(dbToken).toBeNull();

            // Verify employee profile was created for existing user
            const employee = await Employee.findOne({ email: existingUserEmail });
            expect(employee).toBeDefined();
            expect(employee.organizationId.toString()).toBe(orgId.toString());

            // Verify role was assigned
            const employeeRole = await EmployeeRole.findOne({ employeeId: employee._id });
            expect(employeeRole).toBeDefined();
            expect(employeeRole.roleId.toString()).toBe(adminRoleId.toString());
        });
    });

    describe("POST /api/employees", () => {
        it("should successfully create employee profile manually", async () => {
            const res = await request(app)
                .post("/api/employees")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    employeeCode: "EMP-100",
                    firstName: "Alice",
                    lastName: "Smith",
                    email: "alice.smith@example.com",
                    phone: "1234567890"
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.employeeCode).toBe("EMP-100");
            expect(res.body.data.firstName).toBe("Alice");
            expect(res.body.data.lastName).toBe("Smith");
            expect(res.body.data.email).toBe("alice.smith@example.com");
            expect(res.body.data.organizationId.toString()).toBe(orgId.toString());
        });

        it("should return conflict if employeeCode already exists in organization", async () => {
            // First employee manually created
            await request(app)
                .post("/api/employees")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    employeeCode: "EMP-100",
                    firstName: "Alice",
                    lastName: "Smith",
                    email: "alice.smith@example.com"
                });

            // Second employee with same code
            const res = await request(app)
                .post("/api/employees")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    employeeCode: "EMP-100",
                    firstName: "Bob",
                    lastName: "Jones",
                    email: "bob.jones@example.com"
                });

            expect(res.status).toBe(409);
        });

        it("should return conflict if email already exists globally in employees", async () => {
            // First employee manually created
            await request(app)
                .post("/api/employees")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    employeeCode: "EMP-100",
                    firstName: "Alice",
                    lastName: "Smith",
                    email: "alice.smith@example.com"
                });

            // Second employee with same email but different code
            const res = await request(app)
                .post("/api/employees")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    employeeCode: "EMP-200",
                    firstName: "Bob",
                    lastName: "Jones",
                    email: "alice.smith@example.com" // collision
                });

            expect(res.status).toBe(409);
        });

        it("should return bad request if departmentId belongs to another organization", async () => {
            const foreignOrg = await Organization.create({ name: "Foreign", code: "FRGN" });
            const foreignDept = await Department.create({
                name: "Foreign Dept",
                code: "FDEPT",
                organizationId: foreignOrg._id
            });

            const res = await request(app)
                .post("/api/employees")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    employeeCode: "EMP-100",
                    firstName: "Alice",
                    lastName: "Smith",
                    email: "alice.smith@example.com",
                    departmentId: foreignDept._id
                });

            expect(res.status).toBe(400);
        });
    });

    describe("POST /api/employees/bulk-import", () => {
        it("should successfully import multiple employees in transaction", async () => {
            const res = await request(app)
                .post("/api/employees/bulk-import")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    employees: [
                        { employeeCode: "EMP-101", firstName: "Bob", lastName: "Stone", email: "bob.stone@example.com" },
                        { employeeCode: "EMP-102", firstName: "Charlie", lastName: "Brown", email: "charlie.brown@example.com" }
                    ]
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBe(2);

            // Verify both exist in DB
            const emp1 = await Employee.findOne({ employeeCode: "EMP-101" });
            expect(emp1).toBeDefined();
            expect(emp1.firstName).toBe("Bob");

            const emp2 = await Employee.findOne({ employeeCode: "EMP-102" });
            expect(emp2).toBeDefined();
            expect(emp2.firstName).toBe("Charlie");
        });

        it("should fail validation if there are local duplicates in payload list", async () => {
            const res = await request(app)
                .post("/api/employees/bulk-import")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    employees: [
                        { employeeCode: "EMP-101", firstName: "Bob", lastName: "Stone", email: "bob.stone@example.com" },
                        { employeeCode: "EMP-101", firstName: "Charlie", lastName: "Brown", email: "charlie.brown@example.com" } // code collision
                    ]
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toContain("Duplicate employee code found in import list");
        });

        it("should roll back transaction and import nothing if any single record conflicts with database", async () => {
            // Seed one employee in database first
            await Employee.create({
                organizationId: orgId,
                employeeCode: "EMP-EXIST",
                firstName: "Existing",
                lastName: "User",
                email: "existing@example.com"
            });

            // Attempt bulk import containing one new and one duplicate employeeCode
            const res = await request(app)
                .post("/api/employees/bulk-import")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    employees: [
                        { employeeCode: "EMP-NEW-ROLLBACK", firstName: "New", lastName: "Guy", email: "newguy@example.com" },
                        { employeeCode: "EMP-EXIST", firstName: "Duplicate", lastName: "Code", email: "duplicatecode@example.com" }
                    ]
                });

            expect(res.status).toBe(409); // conflict because of EMP-EXIST

            // Verify that the NEW employee was rolled back and is NOT created in database
            const dbNewEmployee = await Employee.findOne({ employeeCode: "EMP-NEW-ROLLBACK" });
            expect(dbNewEmployee).toBeNull();
        });
    });

});
