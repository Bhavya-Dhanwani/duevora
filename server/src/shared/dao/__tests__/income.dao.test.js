import { connectTestDB, disconnectTestDB, clearTestDB } from "./testDb.helper.js";
import mongoose from "mongoose";
import IncomeDao from "../income.dao.js";
import CategoryDao from "../category.dao.js";
import OrganizationDao from "../organization.dao.js";

const incomeDao = new IncomeDao();
const categoryDao = new CategoryDao();
const organizationDao = new OrganizationDao();

beforeAll(async () => {
    await connectTestDB();
    // Dynamically register dummy Account schema so populate works in isolation
    if (!mongoose.models.Account) {
        mongoose.model("Account", new mongoose.Schema({ name: String }));
    }
});

afterAll(async () => {
    await disconnectTestDB();
});

beforeEach(async () => {
    await clearTestDB();
});

describe("Income DAO Tests", () => {
    let org, category, mockAccountId;

    beforeEach(async () => {
        org = await organizationDao.create({ name: "Acme Corp", code: "ACME" });
        category = await categoryDao.create({ organizationId: org._id, name: "Consulting", code: "CONS" });
        const AccountModel = mongoose.model("Account");
        const account = await new AccountModel({ name: "Bank Account" }).save();
        mockAccountId = account._id;
    });

    it("should create an income successfully", async () => {
        const incomeData = {
            organizationId: org._id,
            incomeNumber: "INC-2026-001",
            date: new Date(),
            amount: 5000.00,
            categoryId: category._id,
            accountId: mockAccountId,
            description: "Advisory services fee"
        };
        const income = await incomeDao.create(incomeData);
        expect(income).toBeDefined();
        expect(income.incomeNumber).toBe("INC-2026-001");
        expect(income.amount).toBe(5000.00);
        expect(income.description).toBe("Advisory services fee");
    });

    it("should fail to create duplicate income number in same organization", async () => {
        const i1 = {
            organizationId: org._id,
            incomeNumber: "INC-2026-001",
            date: new Date(),
            amount: 100,
            accountId: mockAccountId
        };
        const i2 = {
            organizationId: org._id,
            incomeNumber: "INC-2026-001",
            date: new Date(),
            amount: 200,
            accountId: mockAccountId
        };

        await incomeDao.create(i1);
        await expect(incomeDao.create(i2)).rejects.toThrow();
    });

    it("should allow same income number in different organizations", async () => {
        const org2 = await organizationDao.create({ name: "Beta Corp", code: "BETA" });

        const i1 = {
            organizationId: org._id,
            incomeNumber: "INC-2026-001",
            date: new Date(),
            amount: 100,
            accountId: mockAccountId
        };
        const i2 = {
            organizationId: org2._id,
            incomeNumber: "INC-2026-001",
            date: new Date(),
            amount: 100,
            accountId: mockAccountId
        };

        const inc1 = await incomeDao.create(i1);
        const inc2 = await incomeDao.create(i2);
        expect(inc1).toBeDefined();
        expect(inc2).toBeDefined();
    });

    it("should find income by id and populate relationships", async () => {
        const income = await incomeDao.create({
            organizationId: org._id,
            incomeNumber: "INC-2026-001",
            date: new Date(),
            amount: 100,
            categoryId: category._id,
            accountId: mockAccountId
        });

        const found = await incomeDao.findById(income._id);
        expect(found).toBeDefined();
        expect(found.categoryId.name).toBe("Consulting");
        expect(found.accountId.name).toBe("Bank Account");
    });

    it("should update income details", async () => {
        const income = await incomeDao.create({
            organizationId: org._id,
            incomeNumber: "INC-2026-001",
            date: new Date(),
            amount: 100,
            accountId: mockAccountId
        });

        const updated = await incomeDao.updateById(income._id, { amount: 120 });
        expect(updated.amount).toBe(120);
    });

    it("should delete income by id", async () => {
        const income = await incomeDao.create({
            organizationId: org._id,
            incomeNumber: "INC-2026-001",
            date: new Date(),
            amount: 100,
            accountId: mockAccountId
        });

        await incomeDao.deleteById(income._id);
        const found = await incomeDao.findById(income._id);
        expect(found).toBeNull();
    });
});
