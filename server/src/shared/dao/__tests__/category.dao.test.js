import { connectTestDB, disconnectTestDB, clearTestDB } from "./testDb.helper.js";
import CategoryDao from "../category.dao.js";
import OrganizationDao from "../organization.dao.js";

const categoryDao = new CategoryDao();
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

describe("Category DAO Tests", () => {
    let org;

    beforeEach(async () => {
        org = await organizationDao.create({ name: "Acme Corp", code: "ACME" });
    });

    it("should create a category successfully", async () => {
        const catData = {
            organizationId: org._id,
            name: "Electronics",
            code: "ELEC"
        };
        const cat = await categoryDao.create(catData);
        expect(cat).toBeDefined();
        expect(cat.name).toBe("Electronics");
        expect(cat.code).toBe("ELEC");
    });

    it("should fail to create duplicate category code in same organization", async () => {
        const cat1 = {
            organizationId: org._id,
            name: "Electronics",
            code: "ELEC"
        };
        const cat2 = {
            organizationId: org._id,
            name: "Home Electronics",
            code: "ELEC"
        };

        await categoryDao.create(cat1);
        await expect(categoryDao.create(cat2)).rejects.toThrow();
    });

    it("should allow nesting categories with parentId", async () => {
        const parent = await categoryDao.create({
            organizationId: org._id,
            name: "Electronics",
            code: "ELEC"
        });

        const child = await categoryDao.create({
            organizationId: org._id,
            name: "Laptops",
            code: "LAP",
            parentId: parent._id
        });

        const foundChild = await categoryDao.findById(child._id);
        expect(foundChild.parentId._id.toString()).toBe(parent._id.toString());
        expect(foundChild.parentId.name).toBe("Electronics");
    });

    it("should update category details", async () => {
        const cat = await categoryDao.create({
            organizationId: org._id,
            name: "Electronics",
            code: "ELEC"
        });

        const updated = await categoryDao.updateById(cat._id, { name: "Consumer Electronics" });
        expect(updated.name).toBe("Consumer Electronics");
    });

    it("should delete category by id", async () => {
        const cat = await categoryDao.create({
            organizationId: org._id,
            name: "Electronics",
            code: "ELEC"
        });

        await categoryDao.deleteById(cat._id);
        const found = await categoryDao.findById(cat._id);
        expect(found).toBeNull();
    });
});
