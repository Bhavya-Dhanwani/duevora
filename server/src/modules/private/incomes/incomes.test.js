import { jest } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";

jest.unstable_mockModule("../../../shared/utils/sendMail.util.js", () => ({ __esModule: true, default: jest.fn() }));

const { default: createApp } = await import("../../../app.js");
const { default: User } = await import("../../../shared/models/user.model.js");
const { default: Employee } = await import("../../../shared/models/employee.model.js");
const { default: Permission } = await import("../../../shared/models/permission.model.js");
const { default: Account } = await import("../../../shared/models/account.model.js");
const { default: JournalEntry } = await import("../../../shared/models/journalEntry.model.js");
const { default: JournalEntryLine } = await import("../../../shared/models/journalEntryLine.model.js");
const { default: Income } = await import("../../../shared/models/income.model.js");

let mongoServer, app, orgId, adminUserToken, userWithoutPermToken;

beforeAll(async () => {
    mongoServer = await MongoMemoryReplSet.create({ replSet: { storageEngine: "wiredTiger" } });
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
    await Permission.create({ name: "Create Incomes", code: "INCOMES.CREATE", module: "incomes" });
    const adminUser = await User.create({ name: "Admin User", email: "admin@example.com", password: "password123", isVerified: true });
    const loginRes = await request(app).post("/api/auth/login").send({ email: "admin@example.com", password: "password123" });
    const onboardRes = await request(app).post("/api/organization").set("Authorization", `Bearer ${loginRes.body.data.accessToken}`)
        .send({ name: "Test Corp", code: "TCORP", firstName: "Admin", lastName: "User" });
    adminUserToken = onboardRes.body.data.accessToken;
    orgId = onboardRes.body.data.organization._id;

    const normalUser = await User.create({ name: "Normal User", email: "normal@example.com", password: "password123", isVerified: true });
    await Employee.create({ userId: normalUser._id, organizationId: orgId, employeeCode: "EMP-002", firstName: "Normal", lastName: "User", email: "normal@example.com", status: "active" });
    const normalLogin = await request(app).post("/api/auth/login").send({ email: "normal@example.com", password: "password123" });
    userWithoutPermToken = normalLogin.body.data.accessToken;
});

describe("Incomes Management Integration Tests", () => {
    let bankAccount;

    beforeEach(async () => {
        bankAccount = await Account.create({ name: "HDFC Bank", code: "HDFC_BANK", type: "asset", organizationId: orgId });
    });

    describe("POST /api/incomes", () => {
        it("should successfully record an income and post journal entries", async () => {
            const res = await request(app)
                .post("/api/incomes")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({ incomeNumber: "INC-2026-001", date: "2026-07-17", amount: 500, accountId: bankAccount._id, description: "Consulting fee" });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.incomeNumber).toBe("INC-2026-001");
            expect(res.body.data.amount).toBe(500);

            const je = await JournalEntry.findOne({ organizationId: orgId });
            expect(je).toBeDefined();
            const lines = await JournalEntryLine.find({ journalEntryId: je._id }).populate("accountId");
            expect(lines.length).toBe(2);
            const bankLine = lines.find(l => l.accountId.code === "HDFC_BANK");
            expect(bankLine.debit).toBe(500);
            const revLine = lines.find(l => l.accountId.code === "INCOME_REVENUE");
            expect(revLine.credit).toBe(500);
        });

        it("should return conflict if income number already exists", async () => {
            await Income.create({ organizationId: orgId, incomeNumber: "INC-2026-001", date: new Date(), amount: 100, accountId: bankAccount._id });
            const res = await request(app)
                .post("/api/incomes")
                .set("Authorization", `Bearer ${adminUserToken}`)
                .send({ incomeNumber: "inc-2026-001", date: "2026-07-17", amount: 200, accountId: bankAccount._id });
            expect(res.status).toBe(409);
        });

        it("should return forbidden without permission", async () => {
            const res = await request(app)
                .post("/api/incomes")
                .set("Authorization", `Bearer ${userWithoutPermToken}`)
                .send({ incomeNumber: "INC-X", date: "2026-07-17", amount: 100, accountId: bankAccount._id });
            expect(res.status).toBe(403);
        });
    });
});
