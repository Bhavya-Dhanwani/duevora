import { connectTestDB, disconnectTestDB, clearTestDB } from "./testDb.helper.js";
import RoleDao from "../role.dao.js";
import OrganizationDao from "../organization.dao.js";

const roleDao = new RoleDao();
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

describe("Role DAO Tests", () => {
    let org;

    beforeEach(async () => {
        org = await organizationDao.create({ name: "Acme Corp", code: "ACME" });
    });

    it("should create a role successfully", async () => {
        const roleData = {
            organizationId: org._id,
            name: "Administrator",
            code: "ADMIN",
            description: "Full system control"
        };
        const role = await roleDao.create(roleData);
        expect(role).toBeDefined();
        expect(role.name).toBe("Administrator");
        expect(role.code).toBe("ADMIN");
    });

    it("should fail to create duplicate role code in same organization", async () => {
        const role1 = {
            organizationId: org._id,
            name: "Administrator",
            code: "ADMIN"
        };
        const role2 = {
            organizationId: org._id,
            name: "Super Admin",
            code: "ADMIN"
        };

        await roleDao.create(role1);
        await expect(roleDao.create(role2)).rejects.toThrow();
    });

    it("should allow same role code in different organizations", async () => {
        const org2 = await organizationDao.create({ name: "Beta Corp", code: "BETA" });

        const role1 = {
            organizationId: org._id,
            name: "Administrator",
            code: "ADMIN"
        };
        const role2 = {
            organizationId: org2._id,
            name: "Administrator",
            code: "ADMIN"
        };

        const r1 = await roleDao.create(role1);
        const r2 = await roleDao.create(role2);
        expect(r1).toBeDefined();
        expect(r2).toBeDefined();
    });

    it("should find role by id and populate relationships", async () => {
        const role = await roleDao.create({
            organizationId: org._id,
            name: "Administrator",
            code: "ADMIN"
        });

        const found = await roleDao.findById(role._id);
        expect(found).toBeDefined();
        expect(found.organizationId._id.toString()).toBe(org._id.toString());
    });

    it("should update role details", async () => {
        const role = await roleDao.create({
            organizationId: org._id,
            name: "Administrator",
            code: "ADMIN"
        });

        const updated = await roleDao.updateById(role._id, { name: "Super Administrator" });
        expect(updated.name).toBe("Super Administrator");
    });

    it("should delete role by id", async () => {
        const role = await roleDao.create({
            organizationId: org._id,
            name: "Administrator",
            code: "ADMIN"
        });

        await roleDao.deleteById(role._id);
        const found = await roleDao.findById(role._id);
        expect(found).toBeNull();
    });
});
