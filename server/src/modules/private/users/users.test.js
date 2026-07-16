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

let mongoServer;
let app;
let orgId;
let adminUserToken;
let userWithoutPermToken;
let normalUserId;

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

    // Seed permission for listing users
    await Permission.create({
        name: "View Users",
        code: "USERS.VIEW",
        module: "users"
    });

    // Seed permission for updating users
    await Permission.create({
        name: "Update Users",
        code: "USERS.UPDATE",
        module: "users"
    });

    // Seed permission for deleting users
    await Permission.create({
        name: "Delete Users",
        code: "USERS.DELETE",
        module: "users"
    });

    // Create an Admin user
    const adminUser = await User.create({
        name: "Admin User",
        email: "admin@example.com",
        password: "password123",
        isVerified: true
    });

    // Onboard Admin User to set up Organization and admin role
    const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: "admin@example.com", password: "password123" });
    
    const token = loginRes.body.data.accessToken;

    const onboardRes = await request(app)
        .post("/api/organization")
        .set("Authorization", `Bearer ${token}`)
        .send({
            name: "Test Corp",
            code: "TCORP",
            firstName: "Admin",
            lastName: "User"
        });

    adminUserToken = onboardRes.body.data.accessToken;
    orgId = onboardRes.body.data.organization._id;

    // Create a secondary user who does NOT have the users.view permission
    const normalUser = await User.create({
        name: "Normal User",
        email: "normal@example.com",
        password: "password123",
        isVerified: true
    });

    normalUserId = normalUser._id;

    // Add this user as employee without USERS.VIEW permission (no roles assigned to them)
    await Employee.create({
        userId: normalUser._id,
        organizationId: orgId,
        employeeCode: "EMP-002",
        firstName: "Normal",
        lastName: "User",
        email: "normal@example.com",
        status: "active"
    });

    const normalLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: "normal@example.com", password: "password123" });

    userWithoutPermToken = normalLogin.body.data.accessToken;
});

describe("Users Management — List, Update & Delete Users Integration Tests", () => {

    describe("GET /api/users", () => {
        it("should list all users in the organization with pagination metadata", async () => {
            // Seed a third user belonging to the same organization
            const user3 = await User.create({
                name: "Developer Bob",
                email: "bob@example.com",
                password: "password123",
                isVerified: true
            });

            await Employee.create({
                userId: user3._id,
                organizationId: orgId,
                employeeCode: "EMP-003",
                firstName: "Developer",
                lastName: "Bob",
                email: "bob@example.com",
                status: "active"
            });

            const res = await request(app)
                .get("/api/users")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .query({ page: 1, limit: 10 });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBe(3); // admin, normal, bob
            expect(res.body.pagination).toBeDefined();
            expect(res.body.pagination.total).toBe(3);
            expect(res.body.pagination.pages).toBe(1);
        });

        it("should filter out soft deleted users from list", async () => {
            const user3 = await User.create({
                name: "Developer Bob",
                email: "bob@example.com",
                password: "password123",
                isVerified: true,
                isDeleted: true
            });

            await Employee.create({
                userId: user3._id,
                organizationId: orgId,
                employeeCode: "EMP-003",
                firstName: "Developer",
                lastName: "Bob",
                email: "bob@example.com",
                status: "inactive"
            });

            const res = await request(app)
                .get("/api/users")
                .set("Authorization", `Bearer ${adminUserToken}`);

            expect(res.status).toBe(200);
            // should only contain admin & normal, not bob
            expect(res.body.data.length).toBe(2);
            expect(res.body.data.map(u => u.email)).not.toContain("bob@example.com");
        });

        it("should filter users by search keyword", async () => {
            const user3 = await User.create({
                name: "Developer Bob",
                email: "bob@example.com",
                password: "password123",
                isVerified: true
            });

            await Employee.create({
                userId: user3._id,
                organizationId: orgId,
                employeeCode: "EMP-003",
                firstName: "Developer",
                lastName: "Bob",
                email: "bob@example.com",
                status: "active"
            });

            const res = await request(app)
                .get("/api/users")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .query({ search: "bob" });

            expect(res.status).toBe(200);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].email).toBe("bob@example.com");
        });

        it("should sort users by name in descending order", async () => {
            const res = await request(app)
                .get("/api/users")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .query({ sortBy: "name", sortOrder: "desc" });

            expect(res.status).toBe(200);
            expect(res.body.data[0].name).toBe("Normal User");
            expect(res.body.data[1].name).toBe("Admin User");
        });

        it("should return forbidden if user does not have USERS.VIEW permission", async () => {
            const res = await request(app)
                .get("/api/users")
                .set("Authorization", `Bearer ${userWithoutPermToken}`);

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });
    });

    describe("PUT /api/users/:userId", () => {
        it("should successfully update user profile details and sync employee record", async () => {
            const res = await request(app)
                .put(`/api/users/${normalUserId}`)
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    name: "Updated Normal Name",
                    email: "updatednormal@example.com"
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe("Updated Normal Name");
            expect(res.body.data.email).toBe("updatednormal@example.com");

            // Verify User in DB is updated
            const dbUser = await User.findById(normalUserId);
            expect(dbUser.name).toBe("Updated Normal Name");
            expect(dbUser.email).toBe("updatednormal@example.com");

            // Verify Employee record email is synced
            const dbEmployee = await Employee.findOne({ userId: normalUserId });
            expect(dbEmployee.email).toBe("updatednormal@example.com");
        });

        it("should fail validation if password is too short", async () => {
            const res = await request(app)
                .put(`/api/users/${normalUserId}`)
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    password: "123" // less than 6 characters
                });

            expect(res.status).toBe(400);
        });

        it("should return conflict if email is already in use by another user", async () => {
            const res = await request(app)
                .put(`/api/users/${normalUserId}`)
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    email: "admin@example.com" // already in use by adminUser
                });

            expect(res.status).toBe(409);
        });

        it("should return forbidden if user does not have USERS.UPDATE permission", async () => {
            const res = await request(app)
                .put(`/api/users/${normalUserId}`)
                .set("Authorization", `Bearer ${userWithoutPermToken}`)
                .send({
                    name: "Hacker Attempt"
                });

            expect(res.status).toBe(403);
        });

        it("should return not found if target userId is from another organization", async () => {
            // Seed a foreign user
            const foreignOrg = await Organization.create({ name: "Foreign", code: "FRGN" });
            const foreignUser = await User.create({ name: "Foreign User", email: "foreign@example.com", password: "password123" });
            await Employee.create({
                userId: foreignUser._id,
                organizationId: foreignOrg._id,
                employeeCode: "FEMP-01",
                firstName: "Foreign",
                lastName: "User",
                email: "foreign@example.com",
                status: "active"
            });

            const res = await request(app)
                .put(`/api/users/${foreignUser._id}`)
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    name: "Attempt Update"
                });

            expect(res.status).toBe(404);
        });
    });

    describe("DELETE /api/users/:userId", () => {
        it("should successfully soft delete user profile and deactivate employee status", async () => {
            const res = await request(app)
                .delete(`/api/users/${normalUserId}`)
                .set("Authorization", `Bearer ${adminUserToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            // Verify User in DB is soft deleted
            const dbUser = await User.findById(normalUserId);
            expect(dbUser.isDeleted).toBe(true);
            expect(dbUser.deletedAt).toBeDefined();
            expect(dbUser.deletedBy).toBeDefined();

            // Verify Employee status is set to inactive
            const dbEmployee = await Employee.findOne({ userId: normalUserId });
            expect(dbEmployee.status).toBe("inactive");
        });

        it("should return forbidden if user does not have USERS.DELETE permission", async () => {
            const res = await request(app)
                .delete(`/api/users/${normalUserId}`)
                .set("Authorization", `Bearer ${userWithoutPermToken}`);

            expect(res.status).toBe(403);
        });

        it("should return not found if target userId is from another organization", async () => {
            // Seed a foreign user
            const foreignOrg = await Organization.create({ name: "Foreign", code: "FRGN" });
            const foreignUser = await User.create({ name: "Foreign User", email: "foreign@example.com", password: "password123" });
            await Employee.create({
                userId: foreignUser._id,
                organizationId: foreignOrg._id,
                employeeCode: "FEMP-01",
                firstName: "Foreign",
                lastName: "User",
                email: "foreign@example.com",
                status: "active"
            });

            const res = await request(app)
                .delete(`/api/users/${foreignUser._id}`)
                .set("Authorization", `Bearer ${adminUserToken}`);

            expect(res.status).toBe(404);
        });
    });

});
