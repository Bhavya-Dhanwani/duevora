import { connectTestDB, disconnectTestDB, clearTestDB } from "./testDb.helper.js";
import WarehouseDao from "../warehouse.dao.js";
import OrganizationDao from "../organization.dao.js";

const warehouseDao = new WarehouseDao();
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

describe("Warehouse DAO Tests", () => {
    let org;

    beforeEach(async () => {
        org = await organizationDao.create({ name: "Acme Corp", code: "ACME" });
    });

    it("should create a warehouse successfully", async () => {
        const whData = {
            organizationId: org._id,
            name: "Central Warehouse",
            code: "CWH",
            address: "123 Logistics Rd"
        };
        const wh = await warehouseDao.create(whData);
        expect(wh).toBeDefined();
        expect(wh.name).toBe("Central Warehouse");
        expect(wh.code).toBe("CWH");
        expect(wh.status).toBe("active");
    });

    it("should fail to create duplicate warehouse code in same organization", async () => {
        const wh1 = {
            organizationId: org._id,
            name: "Central Warehouse",
            code: "CWH"
        };
        const wh2 = {
            organizationId: org._id,
            name: "East Warehouse",
            code: "CWH"
        };

        await warehouseDao.create(wh1);
        await expect(warehouseDao.create(wh2)).rejects.toThrow();
    });

    it("should allow same warehouse code in different organizations", async () => {
        const org2 = await organizationDao.create({ name: "Beta Corp", code: "BETA" });

        const wh1 = {
            organizationId: org._id,
            name: "Central Warehouse",
            code: "CWH"
        };
        const wh2 = {
            organizationId: org2._id,
            name: "Central Warehouse",
            code: "CWH"
        };

        const w1 = await warehouseDao.create(wh1);
        const w2 = await warehouseDao.create(wh2);
        expect(w1).toBeDefined();
        expect(w2).toBeDefined();
    });

    it("should find warehouse by id", async () => {
        const wh = await warehouseDao.create({
            organizationId: org._id,
            name: "Central Warehouse",
            code: "CWH"
        });

        const found = await warehouseDao.findById(wh._id);
        expect(found).toBeDefined();
        expect(found.organizationId._id.toString()).toBe(org._id.toString());
    });

    it("should update warehouse details", async () => {
        const wh = await warehouseDao.create({
            organizationId: org._id,
            name: "Central Warehouse",
            code: "CWH"
        });

        const updated = await warehouseDao.updateById(wh._id, { status: "inactive" });
        expect(updated.status).toBe("inactive");
    });

    it("should delete warehouse by id", async () => {
        const wh = await warehouseDao.create({
            organizationId: org._id,
            name: "Central Warehouse",
            code: "CWH"
        });

        await warehouseDao.deleteById(wh._id);
        const found = await warehouseDao.findById(wh._id);
        expect(found).toBeNull();
    });
});
