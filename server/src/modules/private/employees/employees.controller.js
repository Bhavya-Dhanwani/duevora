// Importing modules
import crypto from "crypto";
import mongoose from "mongoose";
import TokenDao from "../../../shared/dao/token.dao.js";
import RoleDao from "../../../shared/dao/role.dao.js";
import EmployeeDao from "../../../shared/dao/employee.dao.js";
import DepartmentDao from "../../../shared/dao/department.dao.js";

import sendMail from "../../../shared/utils/sendMail.util.js";
import env from "../../../shared/config/env.config.js";

import NotFound from "../../../shared/errors/NotFound.error.js";
import Forbidden from "../../../shared/errors/Forbidden.error.js";
import Conflict from "../../../shared/errors/Conflict.error.js";
import BadRequest from "../../../shared/errors/BadRequest.error.js";

import Created from "../../../shared/responses/Created.response.js";

// class to handle employee operations
class EmployeesController {

    constructor() {

        // initializing the token dao
        this.tokenDao = new TokenDao();

        // initializing the role dao
        this.roleDao = new RoleDao();

        // initializing the employee dao
        this.employeeDao = new EmployeeDao();

        // initializing the department dao
        this.departmentDao = new DepartmentDao();

    }

    // invite a member by generating a 15-minute signup link
    inviteMember = async (req, res) => {

        const { email, roleId } = req.body;
        const organizationId = req.user.organizationId;

        if (!organizationId) {

            throw new Forbidden("User must belong to an organization to invite members.");

        }

        // verifying that the role exists and belongs to the organization using role dao
        const role = await this.roleDao.findOne({ _id: roleId, organizationId });

        if (!role) {

            throw new NotFound("Role not found in your organization.");

        }

        // generating secure 32-character invitation token
        const token = crypto.randomBytes(16).toString("hex");

        if (email) {
            // deleting any existing invitation token for this email to avoid duplicates
            await this.tokenDao.deleteTokenByEmail(email.trim().toLowerCase(), "invitation");
        }

        // saving token in the database using token dao
        await this.tokenDao.createToken({
            email: email ? email.trim().toLowerCase() : undefined,
            type: "invitation",
            value: token,
            roleId,
            organizationId,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        });

        // constructing the invitation link
        const inviteUrl = `${env.FRONTEND_URL}/register?token=${token}`;

        // sending email notification
        if (email) {
            sendMail(
                email.trim().toLowerCase(),
                "Invitation to join Duevora ERP",
                `You have been invited to join the ERP Accounting System. Click the link to register (valid for 15 minutes): ${inviteUrl}`
            );
        }

        // returning the invitation details
        return Created(res, "Invitation link generated successfully", {
            token,
            inviteUrl,
            email: email ? email.trim().toLowerCase() : undefined,
            expiresIn: "15 minutes"
        });

    }

    // create a new employee manually
    createEmployee = async (req, res) => {

        const { employeeCode, firstName, lastName, email, phone, status, joiningDate, departmentId, userId } = req.body;
        const organizationId = req.user.organizationId;

        // checking organization isolation constraints
        if (!organizationId) {

            throw new Forbidden("User must belong to an organization to create employee profile.");

        }

        // verifying that employeeCode is unique within organization
        const existingCode = await this.employeeDao.findOne({ organizationId, employeeCode });

        if (existingCode) {

            throw new Conflict("Employee code already exists in this organization.");

        }

        // verifying that email is globally unique in employee profiles
        const existingEmail = await this.employeeDao.findOne({ email: email.toLowerCase() });

        if (existingEmail) {

            throw new Conflict("Employee with this email already exists.");

        }

        // verifying if userId is provided and belongs to another employee profile
        if (userId) {

            const existingUserLink = await this.employeeDao.findOne({ userId });

            if (existingUserLink) {

                throw new Conflict("This user ID is already linked to another employee.");

            }

        }

        // verifying if departmentId belongs to the organization
        if (departmentId) {

            const department = await this.departmentDao.findOne({ _id: departmentId, organizationId });

            if (!department) {

                throw new BadRequest("Invalid department ID.");

            }

        }

        // creating the employee record using employee dao
        const employee = await this.employeeDao.create({
            userId: userId || null,
            organizationId,
            employeeCode,
            firstName,
            lastName,
            email: email.toLowerCase(),
            phone: phone || "",
            status: status || "active",
            joiningDate: joiningDate || null,
            departmentId: departmentId || null
        });

        // returning the created employee profile
        return Created(res, "Employee profile created successfully", employee);

    }

    // bulk import employees using transactions
    bulkImportEmployees = async (req, res) => {

        const { employees } = req.body;
        const organizationId = req.user.organizationId;

        // checking organization isolation constraints
        if (!organizationId) {

            throw new Forbidden("User must belong to an organization to bulk import employees.");

        }

        // tracking unique codes and emails in the input payload to check for local duplicates
        const inputCodes = new Set();
        const inputEmails = new Set();

        for (const emp of employees) {

            if (inputCodes.has(emp.employeeCode)) {

                throw new BadRequest(`Duplicate employee code found in import list: ${emp.employeeCode}`);

            }

            if (inputEmails.has(emp.email.toLowerCase())) {

                throw new BadRequest(`Duplicate email found in import list: ${emp.email}`);

            }

            inputCodes.add(emp.employeeCode);
            inputEmails.add(emp.email.toLowerCase());

        }

        // starting a mongodb transaction session
        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            const importedEmployees = [];

            for (const emp of employees) {

                // verifying that employeeCode is unique within organization
                const existingCode = await this.employeeDao.findOne({
                    organizationId,
                    employeeCode: emp.employeeCode
                }, session);

                if (existingCode) {

                    throw new Conflict(`Employee code already exists: ${emp.employeeCode}`);

                }

                // verifying that email is globally unique in employee profiles
                const existingEmail = await this.employeeDao.findOne({
                    email: emp.email.toLowerCase()
                }, session);

                if (existingEmail) {

                    throw new Conflict(`Employee with this email already exists: ${emp.email}`);

                }

                // verifying department context if provided
                if (emp.departmentId) {

                    const department = await this.departmentDao.findOne({
                        _id: emp.departmentId,
                        organizationId
                    }, session);

                    if (!department) {

                        throw new BadRequest(`Invalid department ID: ${emp.departmentId}`);

                    }

                }

                // creating employee record using employee dao
                const createdEmp = await this.employeeDao.create({
                    userId: emp.userId || null,
                    organizationId,
                    employeeCode: emp.employeeCode,
                    firstName: emp.firstName,
                    lastName: emp.lastName,
                    email: emp.email.toLowerCase(),
                    phone: emp.phone || "",
                    status: emp.status || "active",
                    joiningDate: emp.joiningDate || null,
                    departmentId: emp.departmentId || null
                }, session);

                importedEmployees.push(createdEmp);

            }

            // committing transaction and saving all documents
            await session.commitTransaction();

            // returning the imported employees
            return Created(res, "Employees imported successfully", importedEmployees);

        } catch (error) {

            // aborting transaction on any failure
            await session.abortTransaction();
            throw error;

        } finally {

            // ending the session
            session.endSession();

        }

    }

}

export default EmployeesController;
