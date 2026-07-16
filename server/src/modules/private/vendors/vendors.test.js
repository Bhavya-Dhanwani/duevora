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
const { default: Permission } = await import("../../../shared/models/permission.model.js");

let mongoServer;
let app;
let orgId;
let adminUserToken;
let userWithoutPermToken;

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

    // Seed permission for creating vendors
    await Permission.create({
        name: "Create Vendors",
        code: "VENDORS.CREATE",
        module: "vendors"
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

    // Create a secondary user who does NOT have the vendors.create permission
    const normalUser = await User.create({
        name: "Normal User",
        email: "normal@example.com",
        password: "password123",
        isVerified: true
    });

    // Add this user as employee without roles
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

describe("Vendors Management — Create Vendor Integration Tests", () => {

    describe("POST /api/vendors", () => {
        it("should successfully create a vendor profile", async () => {
            const res = await request(app)
                .post("/api/vendors")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    name: "Apex Supplies",
                    email: "sales@apex.com",
                    phone: "1234567890",
                    address: "123 Industrial Way",
                    taxNumber: "TAX-1234",
                    status: "active"
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe("Apex Supplies");
            expect(res.body.data.email).toBe("sales@apex.com");
            expect(res.body.data.phone).toBe("1234567890");
            expect(res.body.data.address).toBe("123 Industrial Way");
            expect(res.body.data.taxNumber).toBe("TAX-1234");
            expect(res.body.data.status).toBe("active");
            expect(res.body.data.organizationId.toString()).toBe(orgId.toString());
        });

        it("should fail validation if email is invalid", async () => {
            const res = await request(app)
                .post("/api/vendors")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    name: "Apex Supplies",
                    email: "bad-email"
                });

            expect(res.status).toBe(400);
        });

        it("should return conflict if vendor email already exists within same organization", async () => {
            // Create first vendor
            await request(app)
                .post("/api/vendors")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    name: "First Vendor",
                    email: "sales@apex.com"
                });

            // Attempt to create second vendor with same email
            const res = await request(app)
                .post("/api/vendors")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    name: "Second Vendor",
                    email: "sales@apex.com"
                });

            expect(res.status).toBe(409);
        });

        it("should allow duplicate email across different organizations", async () => {
            // Create first vendor in org 1
            await request(app)
                .post("/api/vendors")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    name: "Org1 Vendor",
                    email: "sales@apex.com"
                });

            // Seed a foreign organization and user/token
            const foreignOrg = await Organization.create({ name: "Foreign Corp", code: "FRGN" });
            const foreignUser = await User.create({ name: "Foreign User", email: "foreign@example.com", password: "password123" });
            
            // Onboard foreign organization
            const loginRes = await request(app)
                .post("/api/auth/login")
                .send({ email: "foreign@example.com", password: "password123" });
            
            const token = loginRes.body.data.accessToken;

            const onboardRes = await request(app)
                .post("/api/organization")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "Foreign Corp Org",
                    code: "FCORP",
                    firstName: "Foreign",
                    lastName: "User"
                });

            const foreignUserToken = onboardRes.body.data.accessToken;

            // Create vendor in org 2 with same email
            const res = await request(app)
                .post("/api/vendors")
                .set("Authorization", `Bearer ${foreignUserToken}`)
                .send({
                    name: "Org2 Vendor",
                    email: "sales@apex.com" // same email, different org
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
        });

        it("should return forbidden if user does not have VENDORS.CREATE permission", async () => {
            const res = await request(app)
                .post("/api/vendors")
                .set("Authorization", `Bearer ${userWithoutPermToken}`)
                .send({
                    name: "Unauthorized Vendor"
                });

            expect(res.status).toBe(403);
        });

        it("should return unauthorized if access token is missing", async () => {
            const res = await request(app)
                .post("/api/vendors")
                .send({
                    name: "Unauthenticated Vendor"
                });

            expect(res.status).toBe(401);
        });
    });

});
