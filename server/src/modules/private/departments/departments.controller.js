// Importing modules
import DepartmentDao from "../../../shared/dao/department.dao.js";
import EmployeeDao from "../../../shared/dao/employee.dao.js";

import Conflict from "../../../shared/errors/Conflict.error.js";
import BadRequest from "../../../shared/errors/BadRequest.error.js";

import Created from "../../../shared/responses/Created.response.js";

// class to handle department operations
class DepartmentsController {

    constructor() {

        // initializing the department dao
        this.departmentDao = new DepartmentDao();

        // initializing the employee dao
        this.employeeDao = new EmployeeDao();

    }

    // create a new department
    createDepartment = async (req, res) => {

        const { name, code, managerId } = req.body;
        const organizationId = req.user.organizationId;

        // checking if department code already exists within the organization
        const existingDept = await this.departmentDao.findOne({
            organizationId,
            code: code.toUpperCase()
        });

        if (existingDept) {

            throw new Conflict("Department code already exists in this organization.");

        }

        // if managerId is provided, verifying that the employee exists and belongs to the organization
        if (managerId) {

            const employee = await this.employeeDao.findOne({
                _id: managerId,
                organizationId
            });

            if (!employee) {

                throw new BadRequest("Invalid manager employee ID.");

            }

        }

        // creating the department using department dao
        const department = await this.departmentDao.create({
            organizationId,
            name,
            code: code.toUpperCase(),
            managerId: managerId || null
        });

        // returning the created department
        return Created(res, "Department created successfully", department);

    }

    listDepartments = async (req, res) => {
        const organizationId = req.user.organizationId;
        const filter = { organizationId };
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const sortBy = req.query.sortBy || "createdAt";
        const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
        const total = await this.departmentDao.Model.countDocuments(filter);
        const items = await this.departmentDao.find(filter, { sort: { [sortBy]: sortOrder }, limit, skip });
        return res.status(200).json({ success: true, status: 200, message: "Departments retrieved successfully", data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    }

}

export default DepartmentsController;
