import { connectTestDB, disconnectTestDB, clearTestDB } from "./testDb.helper.js";
import AccountDao from "../account.dao.js";
import OrganizationDao from "../organization.dao.js";

const accountDao = new AccountDao();
const organizationDao = new OrganizationDao();

beforeAll(async () => {
    await connectTestDB();
});

afterAll(async () => {
    await disconnectTestDB();
});

beforeEach(async () => {
    await clearTestDB();
});

describe("Account DAO Tests", () => {
    let org;

    beforeEach(async () => {
        org = await organizationDao.create({ name: "Acme Corp", code: "ACME" });
    });

    it("should create an account successfully", async () => {
        const accountData = {
            organizationId: org._id,
            name: "Accounts Receivable",
            code: "1200",
            type: "asset"
        };
        const account = await accountDao.create(accountData);
        expect(account).toBeDefined();
        expect(account.name).toBe("Accounts Receivable");
        expect(account.code).toBe("1200");
        expect(account.type).toBe("asset");
        expect(account.status).toBe("active");
    });

    it("should fail to create duplicate account code in same organization", async () => {
        const a1 = {
            organizationId: org._id,
            name: "Accounts Receivable",
            code: "1200",
            type: "asset"
        };
        const a2 = {
            organizationId: org._id,
            name: "Other Asset",
            code: "1200",
            type: "asset"
        };

        await accountDao.create(a1);
        await expect(accountDao.create(a2)).rejects.toThrow();
    });

    it("should allow same account code in different organizations", async () => {
        const org2 = await organizationDao.create({ name: "Beta Corp", code: "BETA" });

        const a1 = {
            organizationId: org._id,
            name: "Accounts Receivable",
            code: "1200",
            type: "asset"
        };
        const a2 = {
            organizationId: org2._id,
            name: "Accounts Receivable",
            code: "1200",
            type: "asset"
        };

        const acc1 = await accountDao.create(a1);
        const acc2 = await accountDao.create(a2);
        expect(acc1).toBeDefined();
        expect(acc2).toBeDefined();
    });

    it("should find account by id", async () => {
        const account = await accountDao.create({
            organizationId: org._id,
            name: "Accounts Receivable",
            code: "1200",
            type: "asset"
        });

        const found = await accountDao.findById(account._id);
        expect(found).toBeDefined();
        expect(found.organizationId._id.toString()).toBe(org._id.toString());
    });

    it("should update account status", async () => {
        const account = await accountDao.create({
            organizationId: org._id,
            name: "Accounts Receivable",
            code: "1200",
            type: "asset"
        });

        const updated = await accountDao.updateById(account._id, { status: "inactive" });
        expect(updated.status).toBe("inactive");
    });

    it("should delete account by id", async () => {
        const account = await accountDao.create({
            organizationId: org._id,
            name: "Accounts Receivable",
            code: "1200",
            type: "asset"
        });

        await accountDao.deleteById(account._id);
        const found = await accountDao.findById(account._id);
        expect(found).toBeNull();
    });
});
