import { jest } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

jest.unstable_mockModule("../../../shared/utils/sendMail.util.js", () => ({ __esModule: true, default: jest.fn() }));

const { default: createApp } = await import("../../../app.js");
const { default: User } = await import("../../../shared/models/user.model.js");
const { default: Permission } = await import("../../../shared/models/permission.model.js");
const { default: Account } = await import("../../../shared/models/account.model.js");
const { default: JournalEntry } = await import("../../../shared/models/journalEntry.model.js");
const { default: LedgerEntry } = await import("../../../shared/models/ledgerEntry.model.js");

let mongoServer, app, orgId, adminUserToken;

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
    await Permission.create({ name: "View Reports", code: "REPORTS.VIEW", module: "reports" });
    await User.create({ name: "Admin User", email: "admin@example.com", password: "password123", isVerified: true });
    const loginRes = await request(app).post("/api/auth/login").send({ email: "admin@example.com", password: "password123" });
    const onboardRes = await request(app).post("/api/organization").set("Authorization", `Bearer ${loginRes.body.data.accessToken}`)
        .send({ name: "Test Corp", code: "TCORP", firstName: "Admin", lastName: "User" });
    adminUserToken = onboardRes.body.data.accessToken;
    orgId = onboardRes.body.data.organization._id;
});

describe("Reports Integration Tests", () => {
    let bankAcc, revenueAcc, expenseAcc;

    beforeEach(async () => {
        bankAcc = await Account.create({ name: "Bank", code: "BANK", type: "asset", organizationId: orgId });
        revenueAcc = await Account.create({ name: "Revenue", code: "REV", type: "revenue", organizationId: orgId });
        expenseAcc = await Account.create({ name: "Expense", code: "EXP", type: "expense", organizationId: orgId });
        const je = await JournalEntry.create({ organizationId: orgId, entryNumber: "JE-001", date: new Date(), narration: "Test", status: "posted" });
        await LedgerEntry.insertMany([
            { organizationId: orgId, accountId: bankAcc._id, journalEntryId: je._id, date: new Date(), debit: 5000, credit: 0 },
            { organizationId: orgId, accountId: revenueAcc._id, journalEntryId: je._id, date: new Date(), debit: 0, credit: 5000 },
            { organizationId: orgId, accountId: expenseAcc._id, journalEntryId: je._id, date: new Date(), debit: 2000, credit: 0 },
            { organizationId: orgId, accountId: bankAcc._id, journalEntryId: je._id, date: new Date(), debit: 0, credit: 2000 }
        ]);
    });

    describe("GET /api/reports/trial-balance", () => {
        it("should return aggregated debit/credit per account", async () => {
            const res = await request(app).get("/api/reports/trial-balance").set("Authorization", `Bearer ${adminUserToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.rows.length).toBeGreaterThan(0);
            expect(res.body.data.grandTotalDebit).toBe(res.body.data.grandTotalCredit);
        });
    });

    describe("GET /api/reports/profit-loss", () => {
        it("should return revenue, expenses and net profit", async () => {
            const res = await request(app).get("/api/reports/profit-loss").set("Authorization", `Bearer ${adminUserToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.revenue).toBe(5000);
            expect(res.body.data.expenses).toBe(2000);
            expect(res.body.data.netProfit).toBe(3000);
        });
    });

    describe("GET /api/reports/balance-sheet", () => {
        it("should return asset, liability, equity breakdown", async () => {
            const res = await request(app).get("/api/reports/balance-sheet").set("Authorization", `Bearer ${adminUserToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.assets).toBeDefined();
        });
    });

    describe("GET /api/reports/cash-flow", () => {
        it("should return inflow, outflow and net cash flow", async () => {
            const res = await request(app).get("/api/reports/cash-flow").set("Authorization", `Bearer ${adminUserToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.netCashFlow).toBeDefined();
        });
    });

    describe("GET /api/reports/ratios", () => {
        it("should successfully retrieve calculated business ratios", async () => {
            const res = await request(app).get("/api/reports/ratios").set("Authorization", `Bearer ${adminUserToken}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.currentRatio).toBeDefined();
            expect(res.body.data.quickRatio).toBeDefined();
            expect(res.body.data.grossProfitMargin).toBeDefined();
            expect(res.body.data.netProfitMargin).toBeDefined();
            expect(res.body.data.debtToEquity).toBeDefined();
        });
    });
});
