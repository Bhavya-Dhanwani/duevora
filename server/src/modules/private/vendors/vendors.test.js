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
const { default: Permission } = await import("../../../shared/models/permission.model.js");
const { default: Vendor } = await import("../../../shared/models/vendor.model.js");

let mongoServer;
let app;
let orgId;
let adminUserToken;
let userWithoutPermToken;

beforeAll(async () => {
    // MongoMemoryReplSet replica set is required for transactions to work
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

    // Seed permissions
    await Permission.create({
        name: "Create Vendors",
        code: "VENDORS.CREATE",
        module: "vendors"
    });

    await Permission.create({
        name: "View Vendors",
        code: "VENDORS.VIEW",
        module: "vendors"
    });

    await Permission.create({
        name: "Update Vendors",
        code: "VENDORS.UPDATE",
        module: "vendors"
    });

    await Permission.create({
        name: "Delete Vendors",
        code: "VENDORS.DELETE",
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

    // Create a secondary user who does NOT have the permissions
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

describe("Vendors Management Integration Tests", () => {

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
            await request(app)
                .post("/api/vendors")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    name: "First Vendor",
                    email: "sales@apex.com"
                });

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
            await request(app)
                .post("/api/vendors")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    name: "Org1 Vendor",
                    email: "sales@apex.com"
                });

            const foreignOrg = await Organization.create({ name: "Foreign Corp", code: "FRGN" });
            const foreignUser = await User.create({ name: "Foreign User", email: "foreign@example.com", password: "password123" });
            
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

            const res = await request(app)
                .post("/api/vendors")
                .set("Authorization", `Bearer ${foreignUserToken}`)
                .send({
                    name: "Org2 Vendor",
                    email: "sales@apex.com"
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
    });

    describe("GET /api/vendors", () => {
        beforeEach(async () => {
            await Vendor.create([
                { name: "Apex Supplies", email: "sales@apex.com", organizationId: orgId },
                { name: "Beta Tools", email: "info@betatools.com", organizationId: orgId },
                { name: "Gamma Logistics", email: "shipping@gamma.com", organizationId: orgId }
            ]);
        });

        it("should successfully list vendors with pagination", async () => {
            const res = await request(app)
                .get("/api/vendors")
                .set("Authorization", `Bearer ${adminUserToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBe(3);
            expect(res.body.pagination.total).toBe(3);
        });

        it("should filter vendors by search keyword", async () => {
            const res = await request(app)
                .get("/api/vendors?search=beta")
                .set("Authorization", `Bearer ${adminUserToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].name).toBe("Beta Tools");
        });

        it("should sort vendors correctly", async () => {
            const res = await request(app)
                .get("/api/vendors?sortBy=name&sortOrder=desc")
                .set("Authorization", `Bearer ${adminUserToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data[0].name).toBe("Gamma Logistics");
        });

        it("should not return vendors from other organizations", async () => {
            const foreignOrg = await Organization.create({ name: "Foreign", code: "FRGN" });
            await Vendor.create({ name: "Foreign Vendor", email: "foreign@example.com", organizationId: foreignOrg._id });

            const res = await request(app)
                .get("/api/vendors")
                .set("Authorization", `Bearer ${adminUserToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.some(v => v.name === "Foreign Vendor")).toBe(false);
        });
    });

    describe("GET /api/vendors/:vendorId", () => {
        let testVendor;

        beforeEach(async () => {
            testVendor = await Vendor.create({
                name: "Apex Supplies",
                email: "sales@apex.com",
                organizationId: orgId
            });
        });

        it("should successfully retrieve vendor details", async () => {
            const res = await request(app)
                .get(`/api/vendors/${testVendor._id}`)
                .set("Authorization", `Bearer ${adminUserToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe("Apex Supplies");
        });

        it("should return 404 not found if vendor belongs to another organization", async () => {
            const foreignOrg = await Organization.create({ name: "Foreign", code: "FRGN" });
            const foreignVendor = await Vendor.create({ name: "Foreign Vendor", email: "foreign@example.com", organizationId: foreignOrg._id });

            const res = await request(app)
                .get(`/api/vendors/${foreignVendor._id}`)
                .set("Authorization", `Bearer ${adminUserToken}`);

            expect(res.status).toBe(404);
        });
    });

    describe("PUT /api/vendors/:vendorId", () => {
        let testVendor;

        beforeEach(async () => {
            testVendor = await Vendor.create({
                name: "Apex Supplies",
                email: "sales@apex.com",
                organizationId: orgId
            });
        });

        it("should successfully update vendor details", async () => {
            const res = await request(app)
                .put(`/api/vendors/${testVendor._id}`)
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    name: "Apex Supplies Updated",
                    email: "apex.updated@corp.com",
                    status: "inactive"
                });

            expect(res.status).toBe(200);
            expect(res.body.data.name).toBe("Apex Supplies Updated");
            expect(res.body.data.email).toBe("apex.updated@corp.com");
            expect(res.body.data.status).toBe("inactive");
        });

        it("should return conflict if email already exists in another vendor within organization", async () => {
            await Vendor.create({ name: "Second Vendor", email: "second@example.com", organizationId: orgId });

            const res = await request(app)
                .put(`/api/vendors/${testVendor._id}`)
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    email: "second@example.com"
                });

            expect(res.status).toBe(409);
        });
    });

    describe("DELETE /api/vendors/:vendorId", () => {
        let testVendor;

        beforeEach(async () => {
            testVendor = await Vendor.create({
                name: "Apex Supplies",
                email: "sales@apex.com",
                organizationId: orgId
            });
        });

        it("should successfully soft delete a vendor profile", async () => {
            const res = await request(app)
                .delete(`/api/vendors/${testVendor._id}`)
                .set("Authorization", `Bearer ${adminUserToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            // Verify in DB that isDeleted is true
            const dbVendor = await Vendor.findById(testVendor._id);
            expect(dbVendor.isDeleted).toBe(true);

            // Fetch details should now fail with 404
            const getRes = await request(app)
                .get(`/api/vendors/${testVendor._id}`)
                .set("Authorization", `Bearer ${adminUserToken}`);
            expect(getRes.status).toBe(404);
        });
    });

    describe("POST /api/vendors/bulk-import", () => {
        it("should successfully import multiple vendors inside transaction", async () => {
            const res = await request(app)
                .post("/api/vendors/bulk-import")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    vendors: [
                        { name: "Bulk Vend 1", email: "bulk1@example.com" },
                        { name: "Bulk Vend 2", email: "bulk2@example.com" }
                    ]
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBe(2);

            const v1 = await Vendor.findOne({ email: "bulk1@example.com" });
            expect(v1).toBeDefined();
            expect(v1.name).toBe("Bulk Vend 1");
        });

        it("should roll back transaction and import nothing on email conflict in DB", async () => {
            await Vendor.create({ name: "Existing Vendor", email: "exist@example.com", organizationId: orgId });

            const res = await request(app)
                .post("/api/vendors/bulk-import")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    vendors: [
                        { name: "New Vendor", email: "new@example.com" },
                        { name: "Conflict Vendor", email: "exist@example.com" }
                    ]
                });

            expect(res.status).toBe(409);

            // Verify that the NEW vendor was rolled back and is NOT created in database
            const dbNewVendor = await Vendor.findOne({ email: "new@example.com" });
            expect(dbNewVendor).toBeNull();
        });
    });

    describe("PATCH /api/vendors/bulk-update", () => {
        let v1, v2;

        beforeEach(async () => {
            v1 = await Vendor.create({ name: "Bulk Upd 1", address: "Old Addr 1", status: "active", organizationId: orgId });
            v2 = await Vendor.create({ name: "Bulk Upd 2", address: "Old Addr 2", status: "active", organizationId: orgId });
        });

        it("should successfully bulk update vendor details in transaction", async () => {
            const res = await request(app)
                .patch("/api/vendors/bulk-update")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    vendorIds: [v1._id, v2._id],
                    updateData: {
                        status: "inactive",
                        address: "New Shared Address"
                    }
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            // Verify updates in DB
            const dbV1 = await Vendor.findById(v1._id);
            expect(dbV1.status).toBe("inactive");
            expect(dbV1.address).toBe("New Shared Address");

            const dbV2 = await Vendor.findById(v2._id);
            expect(dbV2.status).toBe("inactive");
            expect(dbV2.address).toBe("New Shared Address");
        });

        it("should roll back and update nothing if any single vendor ID doesn't exist", async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .patch("/api/vendors/bulk-update")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    vendorIds: [v1._id, fakeId],
                    updateData: { status: "inactive" }
                });

            expect(res.status).toBe(404);

            // Verify v1 status was NOT updated
            const dbV1 = await Vendor.findById(v1._id);
            expect(dbV1.status).toBe("active");
        });
    });

});
