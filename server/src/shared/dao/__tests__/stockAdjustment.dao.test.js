import { connectTestDB, disconnectTestDB, clearTestDB } from "./testDb.helper.js";
import StockAdjustmentDao from "../stockAdjustment.dao.js";
import ProductDao from "../product.dao.js";
import WarehouseDao from "../warehouse.dao.js";
import EmployeeDao from "../employee.dao.js";
import OrganizationDao from "../organization.dao.js";

const stockAdjustmentDao = new StockAdjustmentDao();
const productDao = new ProductDao();
const warehouseDao = new WarehouseDao();
const employeeDao = new EmployeeDao();
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

describe("StockAdjustment DAO Tests", () => {
    let org, product, warehouse, employee;

    beforeEach(async () => {
        org = await organizationDao.create({ name: "Acme Corp", code: "ACME" });
        product = await productDao.create({ organizationId: org._id, name: "Widget A", sku: "WDG-A" });
        warehouse = await warehouseDao.create({ organizationId: org._id, name: "Central", code: "CWH" });
        employee = await employeeDao.create({
            organizationId: org._id,
            employeeCode: "EMP001",
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com"
        });
    });

    it("should create stock adjustment successfully", async () => {
        const adjustment = await stockAdjustmentDao.create({
            organizationId: org._id,
            warehouseId: warehouse._id,
            productId: product._id,
            adjustedQuantity: -5,
            reason: "Damaged item",
            adjustedById: employee._id
        });
        expect(adjustment).toBeDefined();
        expect(adjustment.productId.toString()).toBe(product._id.toString());
        expect(adjustment.adjustedQuantity).toBe(-5);
        expect(adjustment.reason).toBe("Damaged item");
    });

    it("should fail to create stock adjustment without adjustedById", async () => {
        await expect(stockAdjustmentDao.create({
            organizationId: org._id,
            warehouseId: warehouse._id,
            productId: product._id,
            adjustedQuantity: 10
        })).rejects.toThrow();
    });

    it("should find and populate stock adjustment", async () => {
        const adjustment = await stockAdjustmentDao.create({
            organizationId: org._id,
            warehouseId: warehouse._id,
            productId: product._id,
            adjustedQuantity: 10,
            adjustedById: employee._id
        });

        const found = await stockAdjustmentDao.findById(adjustment._id);
        expect(found).toBeDefined();
        expect(found.productId.name).toBe("Widget A");
        expect(found.warehouseId.name).toBe("Central");
        expect(found.adjustedById.firstName).toBe("John");
    });

    it("should update stock adjustment reason", async () => {
        const adjustment = await stockAdjustmentDao.create({
            organizationId: org._id,
            warehouseId: warehouse._id,
            productId: product._id,
            adjustedQuantity: 10,
            adjustedById: employee._id
        });

        const updated = await stockAdjustmentDao.updateById(adjustment._id, { reason: "Recounted" });
        expect(updated.reason).toBe("Recounted");
    });

    it("should delete stock adjustment", async () => {
        const adjustment = await stockAdjustmentDao.create({
            organizationId: org._id,
            warehouseId: warehouse._id,
            productId: product._id,
            adjustedQuantity: 10,
            adjustedById: employee._id
        });

        await stockAdjustmentDao.deleteById(adjustment._id);
        const found = await stockAdjustmentDao.findById(adjustment._id);
        expect(found).toBeNull();
    });
});
