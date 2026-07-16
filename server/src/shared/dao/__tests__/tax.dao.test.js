import { connectTestDB, disconnectTestDB, clearTestDB } from "./testDb.helper.js";
import TaxDao from "../tax.dao.js";
import OrganizationDao from "../organization.dao.js";

const taxDao = new TaxDao();
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

describe("Tax DAO Tests", () => {
    let org;

    beforeEach(async () => {
        org = await organizationDao.create({ name: "Acme Corp", code: "ACME" });
    });

    it("should create a tax successfully", async () => {
        const taxData = {
            organizationId: org._id,
            name: "GST 18%",
            rate: 18.0,
            code: "GST18"
        };
        const tax = await taxDao.create(taxData);
        expect(tax).toBeDefined();
        expect(tax.name).toBe("GST 18%");
        expect(tax.rate).toBe(18.0);
        expect(tax.code).toBe("GST18");
    });

    it("should fail to create duplicate tax code in same organization", async () => {
        const tax1 = {
            organizationId: org._id,
            name: "GST 18%",
            rate: 18.0,
            code: "GST18"
        };
        const tax2 = {
            organizationId: org._id,
            name: "IGST 18%",
            rate: 18.0,
            code: "GST18"
        };

        await taxDao.create(tax1);
        await expect(taxDao.create(tax2)).rejects.toThrow();
    });

    it("should allow same tax code in different organizations", async () => {
        const org2 = await organizationDao.create({ name: "Beta Corp", code: "BETA" });

        const tax1 = {
            organizationId: org._id,
            name: "GST 18%",
            rate: 18.0,
            code: "GST18"
        };
        const tax2 = {
            organizationId: org2._id,
            name: "GST 18%",
            rate: 18.0,
            code: "GST18"
        };

        const t1 = await taxDao.create(tax1);
        const t2 = await taxDao.create(tax2);
        expect(t1).toBeDefined();
        expect(t2).toBeDefined();
    });

    it("should find tax by id", async () => {
        const tax = await taxDao.create({
            organizationId: org._id,
            name: "GST 18%",
            rate: 18.0,
            code: "GST18"
        });

        const found = await taxDao.findById(tax._id);
        expect(found).toBeDefined();
        expect(found.organizationId._id.toString()).toBe(org._id.toString());
    });

    it("should update tax rate", async () => {
        const tax = await taxDao.create({
            organizationId: org._id,
            name: "GST 18%",
            rate: 18.0,
            code: "GST18"
        });

        const updated = await taxDao.updateById(tax._id, { rate: 20.0 });
        expect(updated.rate).toBe(20.0);
    });

    it("should delete tax by id", async () => {
        const tax = await taxDao.create({
            organizationId: org._id,
            name: "GST 18%",
            rate: 18.0,
            code: "GST18"
        });

        await taxDao.deleteById(tax._id);
        const found = await taxDao.findById(tax._id);
        expect(found).toBeNull();
    });
});
