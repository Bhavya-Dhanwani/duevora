// Importing modules
import OrganizationDao from "../../../shared/dao/organization.dao.js";
import EmployeeDao from "../../../shared/dao/employee.dao.js";
import RoleDao from "../../../shared/dao/role.dao.js";
import PermissionDao from "../../../shared/dao/permission.dao.js";
import RolePermissionDao from "../../../shared/dao/rolePermission.dao.js";
import EmployeeRoleDao from "../../../shared/dao/employeeRole.dao.js";
import UserDao from "../../../shared/dao/user.dao.js";
import SessionDao from "../../../shared/dao/session.dao.js";

import createSession from "../../../shared/utils/createSession.util.js";
import Created from "../../../shared/responses/Created.response.js";
import Ok from "../../../shared/responses/Ok.response.js";

import Conflict from "../../../shared/errors/Conflict.error.js";
import NotFound from "../../../shared/errors/NotFound.error.js";
import Forbidden from "../../../shared/errors/Forbidden.error.js";

// class to handle organization operations
class OrganizationController {

    constructor() {

        // initializing the organization dao
        this.orgDao = new OrganizationDao();

        // initializing the employee dao
        this.employeeDao = new EmployeeDao();

        // initializing the role dao
        this.roleDao = new RoleDao();

        // initializing the permission dao
        this.permissionDao = new PermissionDao();

        // initializing the role permission dao
        this.rolePermissionDao = new RolePermissionDao();

        // initializing the employee role dao
        this.employeeRoleDao = new EmployeeRoleDao();

        // initializing the user dao
        this.userDao = new UserDao();

        // initializing the session dao
        this.sessionDao = new SessionDao();

    }

    // onboard a new organization
    onboard = async (req, res) => {

        const { name, code, address, logo, firstName, lastName } = req.body;
        const userId = req.user._id;

        // checking if organization code already exists using the organization dao
        const existingOrg = await this.orgDao.findOne({ code: code.toUpperCase() });
        
        if (existingOrg) {

            throw new Conflict("Organization code already exists");

        }

        // creating organization using the organization dao
        const organization = await this.orgDao.create({
            name,
            code: code.toUpperCase(),
            address,
            logo,
            status: "active"
        });

        // seeding default roles for the organization
        const rolesToCreate = [
            { code: "ADMIN", name: "Administrator", description: "Full system administrator access" },
            { code: "ACCOUNTANT", name: "Accountant", description: "Financial transactions and bookkeeping access" },
            { code: "EMPLOYEE", name: "Employee", description: "Basic employee access" }
        ];

        const createdRoles = {};
        for (const r of rolesToCreate) {

            const createdRole = await this.roleDao.create({
                organizationId: organization._id,
                name: r.name,
                code: r.code,
                description: r.description
            });
            createdRoles[r.code] = createdRole;

        }

        // binding all existing permissions to the ADMIN role
        const allPermissions = await this.permissionDao.find({});
        for (const p of allPermissions) {

            await this.rolePermissionDao.create({
                roleId: createdRoles["ADMIN"]._id,
                permissionId: p._id
            });

        }

        // creating employee profile for the user
        const employee = await this.employeeDao.create({
            userId,
            organizationId: organization._id,
            employeeCode: "EMP-001",
            firstName,
            lastName,
            email: req.user.email,
            status: "active"
        });

        // assigning ADMIN role to the employee
        await this.employeeRoleDao.create({
            employeeId: employee._id,
            roleId: createdRoles["ADMIN"]._id
        });

        // finding user to re-generate session with full multi-tenant organization context
        const user = await this.userDao.findUserById(userId);
        const { sanitizedUser, accessToken } = await createSession(user, res, this.sessionDao);

        return Created(res, "Organization onboarded successfully", {
            user: sanitizedUser,
            organization,
            employee,
            accessToken
        });

    }

    // get organization details
    getDetails = async (req, res) => {

        const organizationId = req.user.organizationId;
        
        if (!organizationId) {

            throw new Forbidden("User is not associated with any organization.");

        }

        // finding organization using organization dao
        const organization = await this.orgDao.findById(organizationId);
        
        if (!organization) {

            throw new NotFound("Organization not found.");

        }

        return Ok(res, "Organization details retrieved successfully", organization);

    }

}

export default OrganizationController;
