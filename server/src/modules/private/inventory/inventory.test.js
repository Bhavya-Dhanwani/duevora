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
const { default: Product } = await import("../../../shared/models/product.model.js");
const { default: Warehouse } = await import("../../../shared/models/warehouse.model.js");
const { default: Inventory } = await import("../../../shared/models/inventory.model.js");

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

    // Seed permission
    await Permission.create({
        name: "View Inventory",
        code: "INVENTORY.VIEW",
        module: "inventory"
    });

    // Create Admin User
    const adminUser = await User.create({
        name: "Admin User",
        email: "admin@example.com",
        password: "password123",
        isVerified: true
    });

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

    // Create normal user without permissions
    const normalUser = await User.create({
        name: "Normal User",
        email: "normal@example.com",
        password: "password123",
        isVerified: true
    });

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

describe("Inventory Management Integration Tests", () => {

    describe("GET /api/inventory", () => {
        let product, warehouse;

        beforeEach(async () => {
            product = await Product.create({ name: "Widget A", sku: "WDG-A", organizationId: orgId });
            warehouse = await Warehouse.create({ name: "Central", code: "CWH", organizationId: orgId });
            await Inventory.create({
                organizationId: orgId,
                productId: product._id,
                warehouseId: warehouse._id,
                quantity: 42
            });
        });

        it("should successfully list inventory levels", async () => {
            const res = await request(app)
                .get("/api/inventory")
                .set("Authorization", `Bearer ${adminUserToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].quantity).toBe(42);
            expect(res.body.data[0].productId._id.toString()).toBe(product._id.toString());
            expect(res.body.data[0].warehouseId._id.toString()).toBe(warehouse._id.toString());
        });

        it("should filter inventory by productId", async () => {
            const res = await request(app)
                .get(`/api/inventory?productId=${product._id}`)
                .set("Authorization", `Bearer ${adminUserToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.length).toBe(1);
        });

        it("should filter inventory by warehouseId", async () => {
            const res = await request(app)
                .get(`/api/inventory?warehouseId=${warehouse._id}`)
                .set("Authorization", `Bearer ${adminUserToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.length).toBe(1);
        });

        it("should not return inventory from other organizations", async () => {
            const foreignOrg = await Organization.create({ name: "Foreign Corp", code: "FRGN" });
            const foreignProduct = await Product.create({ name: "F Widget", sku: "F-WDG", organizationId: foreignOrg._id });
            const foreignWarehouse = await Warehouse.create({ name: "F Ware", code: "F-WH", organizationId: foreignOrg._id });
            await Inventory.create({
                organizationId: foreignOrg._id,
                productId: foreignProduct._id,
                warehouseId: foreignWarehouse._id,
                quantity: 100
            });

            const res = await request(app)
                .get("/api/inventory")
                .set("Authorization", `Bearer ${adminUserToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].quantity).toBe(42); // only test corp inventory
        });

        it("should return forbidden if user does not have INVENTORY.VIEW permission", async () => {
            const res = await request(app)
                .get("/api/inventory")
                .set("Authorization", `Bearer ${userWithoutPermToken}`);

            expect(res.status).toBe(403);
        });
    });

});
