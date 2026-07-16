import { connectTestDB, disconnectTestDB, clearTestDB } from "./testDb.helper.js";
import PurchaseOrderDao from "../purchaseOrder.dao.js";
import VendorDao from "../vendor.dao.js";
import OrganizationDao from "../organization.dao.js";

const purchaseOrderDao = new PurchaseOrderDao();
const vendorDao = new VendorDao();
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

describe("PurchaseOrder DAO Tests", () => {
    let org, vendor;

    beforeEach(async () => {
        org = await organizationDao.create({ name: "Acme Corp", code: "ACME" });
        vendor = await vendorDao.create({ organizationId: org._id, name: "Supplier Inc" });
    });

    it("should create a purchase order successfully", async () => {
        const poData = {
            organizationId: org._id,
            vendorId: vendor._id,
            poNumber: "PO-2026-001",
            poDate: new Date(),
            grandTotal: 1200.00,
            status: "draft"
        };
        const po = await purchaseOrderDao.create(poData);
        expect(po).toBeDefined();
        expect(po.poNumber).toBe("PO-2026-001");
        expect(po.grandTotal).toBe(1200.00);
        expect(po.status).toBe("draft");
    });

    it("should fail to create duplicate PO number in same organization", async () => {
        const p1 = {
            organizationId: org._id,
            vendorId: vendor._id,
            poNumber: "PO-2026-001",
            poDate: new Date(),
            grandTotal: 100
        };
        const p2 = {
            organizationId: org._id,
            vendorId: vendor._id,
            poNumber: "PO-2026-001",
            poDate: new Date(),
            grandTotal: 200
        };

        await purchaseOrderDao.create(p1);
        await expect(purchaseOrderDao.create(p2)).rejects.toThrow();
    });

    it("should allow same PO number in different organizations", async () => {
        const org2 = await organizationDao.create({ name: "Beta Corp", code: "BETA" });
        const vendor2 = await vendorDao.create({ organizationId: org2._id, name: "Supplier Inc 2" });

        const p1 = {
            organizationId: org._id,
            vendorId: vendor._id,
            poNumber: "PO-2026-001",
            poDate: new Date(),
            grandTotal: 100
        };
        const p2 = {
            organizationId: org2._id,
            vendorId: vendor2._id,
            poNumber: "PO-2026-001",
            poDate: new Date(),
            grandTotal: 100
        };

        const order1 = await purchaseOrderDao.create(p1);
        const order2 = await purchaseOrderDao.create(p2);
        expect(order1).toBeDefined();
        expect(order2).toBeDefined();
    });

    it("should find purchase order by id and populate relationship", async () => {
        const po = await purchaseOrderDao.create({
            organizationId: org._id,
            vendorId: vendor._id,
            poNumber: "PO-2026-001",
            poDate: new Date(),
            grandTotal: 100
        });

        const found = await purchaseOrderDao.findById(po._id);
        expect(found).toBeDefined();
        expect(found.vendorId.name).toBe("Supplier Inc");
    });

    it("should update purchase order status", async () => {
        const po = await purchaseOrderDao.create({
            organizationId: org._id,
            vendorId: vendor._id,
            poNumber: "PO-2026-001",
            poDate: new Date(),
            grandTotal: 100
        });

        const updated = await purchaseOrderDao.updateById(po._id, { status: "ordered" });
        expect(updated.status).toBe("ordered");
    });

    it("should delete purchase order by id", async () => {
        const po = await purchaseOrderDao.create({
            organizationId: org._id,
            vendorId: vendor._id,
            poNumber: "PO-2026-001",
            poDate: new Date(),
            grandTotal: 100
        });

        await purchaseOrderDao.deleteById(po._id);
        const found = await purchaseOrderDao.findById(po._id);
        expect(found).toBeNull();
    });
});
