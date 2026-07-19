// Importing modules
import ProjectDao from "../../../shared/dao/project.dao.js";
import CustomerDao from "../../../shared/dao/customer.dao.js";

import Conflict from "../../../shared/errors/Conflict.error.js";
import NotFound from "../../../shared/errors/NotFound.error.js";

import Created from "../../../shared/responses/Created.response.js";

// class to handle projects operations
class ProjectsController {

    constructor() {

        // initializing the project dao
        this.projectDao = new ProjectDao();

        // initializing the customer dao
        this.customerDao = new CustomerDao();

    }

    // create a new project
    createProject = async (req, res) => {

        // extracting required fields from request body
        const { name, code, customerId, status } = req.body;
        const organizationId = req.user.organizationId;

        // formatting project code to uppercase
        const formattedCode = code.trim().toUpperCase();

        // validating customer if provided
        if (customerId) {

            const customer = await this.customerDao.findOne({ _id: customerId, organizationId });

            if (!customer) {

                throw new NotFound("Customer reference not found in your organization.");

            }

        }

        // checking that project code is unique in organization context
        const existing = await this.projectDao.findOne({ organizationId, code: formattedCode });

        if (existing) {

            throw new Conflict("Project code already exists in your organization.");

        }

        // creating project record using project dao
        const project = await this.projectDao.create({
            organizationId,
            name: name.trim(),
            code: formattedCode,
            customerId: customerId || undefined,
            status: status || "active"
        });

        // returning the created project
        return Created(res, "Project created successfully", project);

    }

    listProjects = async (req, res) => {
        const organizationId = req.user.organizationId;
        const filter = { organizationId };
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const sortBy = req.query.sortBy || "createdAt";
        const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
        const total = await this.projectDao.Model.countDocuments(filter);
        const items = await this.projectDao.find(filter, { sort: { [sortBy]: sortOrder }, limit, skip });
        return res.status(200).json({ success: true, status: 200, message: "Projects retrieved successfully", data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    }

}

export default ProjectsController;
