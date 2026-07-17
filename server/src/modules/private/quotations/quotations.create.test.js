import { jest } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

jest.unstable_mockModule("../../../shared/utils/sendMail.util.js", () => ({ __esModule: true, default: jest.fn() }));

const { default: createApp } = await import("../../../app.js");
const { default: User } = await import("../../../shared/models/user.model.js");
const { default: Employee } = await import("../../../shared/models/employee.model.js");
const { default: Permission } = await import("../../../shared/models/permission.model.js");
const { default: Customer } = await import("../../../shared/models/customer.model.js");
const { default: Quotation } = await import("../../../shared/models/quotation.model.js");

let mongoServer, app, orgId, adminUserToken, userWithoutPermToken;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = createApp();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    for (const key in mongoose.connection.collections) { await mongoose.connection.collections[key].deleteMany({}); }
    await Permission.create({ name: "Create Quotations", code: "QUOTATIONS.CREATE", module: "quotations" });
    const loginRes = await request(app).post("/api/auth/login").send({ email: "admin@example.com", password: "password123" });
    await User.create({ name: "Admin User", email: "admin@example.com", password: "password123", isVerified: true });
    const loginRes2 = await request(app).post("/api/auth/login").send({ email: "admin@example.com", password: "password123" });
    const onboardRes = await request(app).post("/api/organization").set("Authorization", `Bearer ${loginRes2.body.data.accessToken}`)
        .send({ name: "Test Corp", code: "TCORP", firstName: "Admin", lastName: "User" });
    adminUserToken = onboardRes.body.data.accessToken;
    orgId = onboardRes.body.data.organization._id;
    const normalUser = await User.create({ name: "Normal User", email: "normal@example.com", password: "password123", isVerified: true });
    await Employee.create({ userId: normalUser._id, organizationId: orgId, employeeCode: "EMP-002", firstName: "Normal", lastName: "User", email: "normal@example.com", status: "active" });
    const normalLogin = await request(app).post("/api/auth/login").send({ email: "normal@example.com", password: "password123" });
    userWithoutPermToken = normalLogin.body.data.accessToken;
});

describe("Quotations Create Integration Tests", () => {
    let customer;

    beforeEach(async () => {
        customer = await Customer.create({ name: "Test Customer", organizationId: orgId });
    });

    describe("POST /api/quotations", () => {
        it("should create a quotation successfully", async () => {
            const res = await request(app)
                .post("/api/quotations")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({ customerId: customer._id, quotationNumber: "QT-2026-001", date: "2026-07-17", subTotal: 1000, taxTotal: 180, grandTotal: 1180 });
            expect(res.status).toBe(201);
            expect(res.body.data.quotationNumber).toBe("QT-2026-001");
            expect(res.body.data.status).toBe("draft");
        });

        it("should return conflict if quotation number already exists", async () => {
            await Quotation.create({ organizationId: orgId, customerId: customer._id, quotationNumber: "QT-2026-001", date: new Date(), subTotal: 1000, taxTotal: 0, grandTotal: 1000 });
            const res = await request(app)
                .post("/api/quotations")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({ customerId: customer._id, quotationNumber: "qt-2026-001", date: "2026-07-17", subTotal: 500, grandTotal: 500 });
            expect(res.status).toBe(409);
        });

        it("should return forbidden without permission", async () => {
            const res = await request(app).post("/api/quotations").set("Authorization", `Bearer ${userWithoutPermToken}`)
                .send({ customerId: customer._id, quotationNumber: "QT-X", date: "2026-07-17", subTotal: 100, grandTotal: 100 });
            expect(res.status).toBe(403);
        });
    });
});
