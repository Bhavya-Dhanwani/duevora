// Importing modules
import CostCenterDao from "../../../shared/dao/costCenter.dao.js";

import Conflict from "../../../shared/errors/Conflict.error.js";

import Created from "../../../shared/responses/Created.response.js";

// class to handle cost center operations
class CostCentersController {

    constructor() {

        // initializing the cost center dao
        this.costCenterDao = new CostCenterDao();

    }

    // create a new cost center
    createCostCenter = async (req, res) => {

        const { name, code, status } = req.body;
        const organizationId = req.user.organizationId;

        // formatting the cost center code to uppercase
        const formattedCode = code.trim().toUpperCase();

        // verifying cost center code is unique within the organization context
        const existing = await this.costCenterDao.findOne({ organizationId, code: formattedCode });

        if (existing) {

            throw new Conflict("Cost center code already exists in your organization.");

        }

        // creating the cost center record using cost center dao
        const costCenter = await this.costCenterDao.create({
            organizationId,
            name: name.trim(),
            code: formattedCode,
            status: status || "active"
        });

        // returning the created cost center
        return Created(res, "Cost center created successfully", costCenter);

    }

    listCostCenters = async (req, res) => {
        const organizationId = req.user.organizationId;
        const filter = { organizationId };
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const sortBy = req.query.sortBy || "createdAt";
        const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
        const total = await this.costCenterDao.Model.countDocuments(filter);
        const items = await this.costCenterDao.find(filter, { sort: { [sortBy]: sortOrder }, limit, skip });
        return res.status(200).json({ success: true, status: 200, message: "Cost centers retrieved successfully", data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    }

}

export default CostCentersController;
