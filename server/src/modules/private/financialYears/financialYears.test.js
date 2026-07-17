import { jest } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

jest.unstable_mockModule("../../../shared/utils/sendMail.util.js", () => ({
    __esModule: true,
    default: jest.fn(),
}));

const { default: createApp } = await import("../../../app.js");
const { default: User } = await import("../../../shared/models/user.model.js");
const { default: Employee } = await import("../../../shared/models/employee.model.js");
const { default: Permission } = await import("../../../shared/models/permission.model.js");

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
    for (const key in mongoose.connection.collections) {
        await mongoose.connection.collections[key].deleteMany({});
    }

    await Permission.create({ name: "Create Financial Years", code: "FINANCIALYEARS.CREATE", module: "financialYears" });

    const adminUser = await User.create({ name: "Admin User", email: "admin@example.com", password: "password123", isVerified: true });
    const loginRes = await request(app).post("/api/auth/login").send({ email: "admin@example.com", password: "password123" });
    const token = loginRes.body.data.accessToken;

    const onboardRes = await request(app).post("/api/organization").set("Authorization", `Bearer ${token}`)
        .send({ name: "Test Corp", code: "TCORP", firstName: "Admin", lastName: "User" });
    adminUserToken = onboardRes.body.data.accessToken;
    orgId = onboardRes.body.data.organization._id;

    const normalUser = await User.create({ name: "Normal User", email: "normal@example.com", password: "password123", isVerified: true });
    await Employee.create({ userId: normalUser._id, organizationId: orgId, employeeCode: "EMP-002", firstName: "Normal", lastName: "User", email: "normal@example.com", status: "active" });
    const normalLogin = await request(app).post("/api/auth/login").send({ email: "normal@example.com", password: "password123" });
    userWithoutPermToken = normalLogin.body.data.accessToken;
});

describe("Financial Years Management Integration Tests", () => {
    describe("POST /api/financial-years", () => {
        it("should successfully create a financial year", async () => {
            const res = await request(app)
                .post("/api/financial-years")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({ name: "FY 2026-27", startDate: "2026-04-01", endDate: "2027-03-31" });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe("FY 2026-27");
            expect(res.body.data.isClosed).toBe(false);
        });

        it("should return 400 if end date is before start date", async () => {
            const res = await request(app)
                .post("/api/financial-years")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({ name: "Invalid FY", startDate: "2027-03-31", endDate: "2026-04-01" });

            expect(res.status).toBe(400);
        });

        it("should return forbidden without permission", async () => {
            const res = await request(app)
                .post("/api/financial-years")
                .set("Authorization", `Bearer ${userWithoutPermToken}`)
                .send({ name: "FY 2026-27", startDate: "2026-04-01", endDate: "2027-03-31" });

            expect(res.status).toBe(403);
        });
    });
});
