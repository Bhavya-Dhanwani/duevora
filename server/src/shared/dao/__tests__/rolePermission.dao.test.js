import { connectTestDB, disconnectTestDB, clearTestDB } from "./testDb.helper.js";
import RolePermissionDao from "../rolePermission.dao.js";
import RoleDao from "../role.dao.js";
import PermissionDao from "../permission.dao.js";
import OrganizationDao from "../organization.dao.js";

const rolePermissionDao = new RolePermissionDao();
const roleDao = new RoleDao();
const permissionDao = new PermissionDao();
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

describe("RolePermission DAO Tests", () => {
    let org, role, permission;

    beforeEach(async () => {
        org = await organizationDao.create({ name: "Acme Corp", code: "ACME" });
        role = await roleDao.create({ organizationId: org._id, name: "Manager", code: "MGR" });
        permission = await permissionDao.create({ name: "Create Invoice", code: "INV_CREATE", module: "billing" });
    });

    it("should create a role permission link successfully", async () => {
        const rp = await rolePermissionDao.create({
            roleId: role._id,
            permissionId: permission._id
        });
        expect(rp).toBeDefined();
        expect(rp.roleId.toString()).toBe(role._id.toString());
        expect(rp.permissionId.toString()).toBe(permission._id.toString());
    });

    it("should fail to create duplicate role permission links", async () => {
        await rolePermissionDao.create({
            roleId: role._id,
            permissionId: permission._id
        });

        await expect(rolePermissionDao.create({
            roleId: role._id,
            permissionId: permission._id
        })).rejects.toThrow();
    });

    it("should find and populate role permission", async () => {
        const rp = await rolePermissionDao.create({
            roleId: role._id,
            permissionId: permission._id
        });

        const found = await rolePermissionDao.findById(rp._id);
        expect(found).toBeDefined();
        expect(found.roleId._id.toString()).toBe(role._id.toString());
        expect(found.roleId.name).toBe("Manager");
        expect(found.permissionId._id.toString()).toBe(permission._id.toString());
        expect(found.permissionId.name).toBe("Create Invoice");
    });

    it("should delete role permission successfully", async () => {
        const rp = await rolePermissionDao.create({
            roleId: role._id,
            permissionId: permission._id
        });

        await rolePermissionDao.deleteById(rp._id);
        const found = await rolePermissionDao.findById(rp._id);
        expect(found).toBeNull();
    });
});
