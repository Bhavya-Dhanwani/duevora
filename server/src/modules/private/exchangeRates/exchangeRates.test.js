import { jest } from "@jest/globals";
jest.setTimeout(20000);
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
const { default: Currency } = await import("../../../shared/models/currency.model.js");

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
        name: "Create Exchange Rates",
        code: "EXCHANGERATES.CREATE",
        module: "exchangeRates"
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

describe("Exchange Rates Management Integration Tests", () => {

    describe("POST /api/exchange-rates", () => {
        let currency;

        beforeEach(async () => {
            currency = await Currency.create({
                name: "Euro",
                code: "EUR",
                symbol: "€",
                organizationId: orgId
            });
        });

        it("should successfully create an exchange rate with valid currency reference", async () => {
            const res = await request(app)
                .post("/api/exchange-rates")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    currencyId: currency._id,
                    rate: 1.12,
                    effectiveDate: "2026-07-17"
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.currencyId.toString()).toBe(currency._id.toString());
            expect(res.body.data.rate).toBe(1.12);
            expect(res.body.data.effectiveDate).toBeDefined();
            expect(res.body.data.organizationId.toString()).toBe(orgId.toString());
        });

        it("should return 404 if currency belongs to a foreign organization", async () => {
            const foreignOrg = await Organization.create({ name: "Foreign Corp", code: "FRGN" });
            const foreignCurrency = await Currency.create({
                name: "Euro",
                code: "EUR",
                symbol: "€",
                organizationId: foreignOrg._id
            });

            const res = await request(app)
                .post("/api/exchange-rates")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    currencyId: foreignCurrency._id,
                    rate: 1.12,
                    effectiveDate: "2026-07-17"
                });

            expect(res.status).toBe(404);
        });

        it("should return 404 if currencyId does not exist", async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .post("/api/exchange-rates")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({
                    currencyId: fakeId,
                    rate: 1.12,
                    effectiveDate: "2026-07-17"
                });

            expect(res.status).toBe(404);
        });

        it("should return forbidden if user does not have EXCHANGERATES.CREATE permission", async () => {
            const res = await request(app)
                .post("/api/exchange-rates")
                .set("Authorization", `Bearer ${userWithoutPermToken}`)
                .send({
                    currencyId: currency._id,
                    rate: 1.12,
                    effectiveDate: "2026-07-17"
                });

            expect(res.status).toBe(403);
        });
    });

});
