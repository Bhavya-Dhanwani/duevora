import { connectTestDB, disconnectTestDB, clearTestDB } from "./testDb.helper.js";
import ProductDao from "../product.dao.js";
import OrganizationDao from "../organization.dao.js";

const productDao = new ProductDao();
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

describe("Product DAO Tests", () => {
    let org;

    beforeEach(async () => {
        org = await organizationDao.create({ name: "Acme Corp", code: "ACME" });
    });

    it("should create a product successfully", async () => {
        const productData = {
            organizationId: org._id,
            name: "Widget A",
            sku: "WDG-A",
            description: "High quality widget",
            price: 19.99,
            cost: 10.00
        };
        const product = await productDao.create(productData);
        expect(product).toBeDefined();
        expect(product.name).toBe("Widget A");
        expect(product.sku).toBe("WDG-A");
        expect(product.price).toBe(19.99);
        expect(product.cost).toBe(10.00);
        expect(product.status).toBe("active");
    });

    it("should fail to create product with duplicate SKU in same org", async () => {
        const p1 = {
            organizationId: org._id,
            name: "Widget A",
            sku: "WDG-A"
        };
        const p2 = {
            organizationId: org._id,
            name: "Widget B",
            sku: "WDG-A"
        };

        await productDao.create(p1);
        await expect(productDao.create(p2)).rejects.toThrow();
    });

    it("should allow same SKU in different organizations", async () => {
        const org2 = await organizationDao.create({ name: "Beta Corp", code: "BETA" });

        const p1 = {
            organizationId: org._id,
            name: "Widget A",
            sku: "WDG-A"
        };
        const p2 = {
            organizationId: org2._id,
            name: "Widget B",
            sku: "WDG-A"
        };

        const prod1 = await productDao.create(p1);
        const prod2 = await productDao.create(p2);
        expect(prod1).toBeDefined();
        expect(prod2).toBeDefined();
    });

    it("should find product by id", async () => {
        const product = await productDao.create({
            organizationId: org._id,
            name: "Widget A",
            sku: "WDG-A"
        });

        const found = await productDao.findById(product._id);
        expect(found).toBeDefined();
        expect(found.organizationId._id.toString()).toBe(org._id.toString());
    });

    it("should update product details", async () => {
        const product = await productDao.create({
            organizationId: org._id,
            name: "Widget A",
            sku: "WDG-A"
        });

        const updated = await productDao.updateById(product._id, { price: 29.99 });
        expect(updated.price).toBe(29.99);
    });

    it("should delete product by id", async () => {
        const product = await productDao.create({
            organizationId: org._id,
            name: "Widget A",
            sku: "WDG-A"
        });

        await productDao.deleteById(product._id);
        const found = await productDao.findById(product._id);
        expect(found).toBeNull();
    });
});
