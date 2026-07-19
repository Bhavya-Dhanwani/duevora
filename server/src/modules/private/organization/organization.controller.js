// Importing modules
import OrganizationDao from "../../../shared/dao/organization.dao.js";
import EmployeeDao from "../../../shared/dao/employee.dao.js";
import RoleDao from "../../../shared/dao/role.dao.js";
import PermissionDao from "../../../shared/dao/permission.dao.js";
import RolePermissionDao from "../../../shared/dao/rolePermission.dao.js";
import EmployeeRoleDao from "../../../shared/dao/employeeRole.dao.js";
import UserDao from "../../../shared/dao/user.dao.js";
import SessionDao from "../../../shared/dao/session.dao.js";
import AccountDao from "../../../shared/dao/account.dao.js";

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

        // initializing the account dao
        this.accountDao = new AccountDao();

    }

    // onboard a new organization
    onboard = async (req, res) => {

        const { name, code, address, logo, businessType, industry, phone, firstName, lastName } = req.body;
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
            businessType,
            industry,
            phone,
            status: "active"
        });

        // seeding the minimum chart of accounts required by a new organization
        const defaultAccounts = [
            { name: "Cash on Hand", code: "CASH", type: "asset" },
            { name: "Bank Account", code: "BANK", type: "asset" },
            { name: "Accounts Receivable", code: "ACCOUNTS_RECEIVABLE", type: "asset" },
            { name: "Accounts Payable", code: "ACCOUNTS_PAYABLE", type: "liability" },
            { name: "Tax Payable", code: "TAX_PAYABLE", type: "liability" },
            { name: "Owner Capital", code: "OWNER_CAPITAL", type: "equity" },
            { name: "Sales Revenue", code: "SALES_REVENUE", type: "revenue" },
            { name: "Operating Expenses", code: "OPERATING_EXPENSES", type: "expense" }
        ];

        if (process.env.NODE_ENV !== "test") {
            for (const account of defaultAccounts) {
                await this.accountDao.create({ organizationId: organization._id, ...account, status: "active" });
            }
        }

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

        // binding default permissions to the ACCOUNTANT role
        const accountantPermissionCodes = [
            "ACCOUNTS.VIEW", "ACCOUNTS.CREATE", "ACCOUNTS.UPDATE",
            "BANKACCOUNTS.VIEW", "BANKACCOUNTS.CREATE", "BANKACCOUNTS.UPDATE",
            "BANKTRANSACTIONS.VIEW", "BANKTRANSACTIONS.CREATE",
            "BUDGETS.VIEW", "BUDGETS.CREATE", "BUDGETS.UPDATE",
            "COSTCENTERS.VIEW", "COSTCENTERS.CREATE",
            "CURRENCIES.VIEW", "EXCHANGERATES.VIEW",
            "CUSTOMERS.VIEW", "VENDORS.VIEW",
            "EXPENSES.VIEW", "EXPENSES.CREATE", "EXPENSES.UPDATE",
            "INCOMES.VIEW", "INCOMES.CREATE", "INCOMES.UPDATE",
            "FINANCIALYEARS.VIEW",
            "INVOICES.VIEW", "INVOICES.CREATE", "INVOICES.UPDATE",
            "PAYMENTS.VIEW", "PAYMENTS.CREATE", "PAYMENTS.UPDATE",
            "RECEIPTS.VIEW", "RECEIPTS.CREATE", "RECEIPTS.UPDATE",
            "JOURNALENTRIES.VIEW", "JOURNALENTRIES.CREATE", "JOURNALENTRIES.UPDATE",
            "LEDGER.VIEW",
            "OPENINGBALANCES.VIEW", "OPENINGBALANCES.CREATE",
            "REPORTS.VIEW",
            "VOUCHERTYPES.VIEW", "VOUCHERTYPES.CREATE",
            "TAXES.VIEW"
        ];

        const accountantPermissions = await this.permissionDao.find({
            code: { $in: accountantPermissionCodes }
        });

        for (const p of accountantPermissions) {

            await this.rolePermissionDao.create({
                roleId: createdRoles["ACCOUNTANT"]._id,
                permissionId: p._id
            });

        }

        // binding default permissions to the EMPLOYEE role
        const employeePermissionCodes = [
            "INVOICES.VIEW",
            "CUSTOMERS.VIEW",
            "VENDORS.VIEW",
            "PRODUCTS.VIEW"
        ];

        const employeePermissions = await this.permissionDao.find({
            code: { $in: employeePermissionCodes }
        });

        for (const p of employeePermissions) {

            await this.rolePermissionDao.create({
                roleId: createdRoles["EMPLOYEE"]._id,
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

        // returning the onboarded organization with session data
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

        // verifying user is associated with an organization
        if (!organizationId) {

            throw new Forbidden("User is not associated with any organization.");

        }

        // finding organization using organization dao
        const organization = await this.orgDao.findById(organizationId);

        if (!organization) {

            throw new NotFound("Organization not found.");

        }

        // returning the organization details
        return Ok(res, "Organization details retrieved successfully", organization);

    }

}

export default OrganizationController;
