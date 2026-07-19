// Importing modules
import UnitDao from "../../../shared/dao/unit.dao.js";

import Conflict from "../../../shared/errors/Conflict.error.js";

import Created from "../../../shared/responses/Created.response.js";

// class to handle unit operations
class UnitsController {

    constructor() {

        // initializing the unit dao
        this.unitDao = new UnitDao();

    }

    // create a new unit
    createUnit = async (req, res) => {

        const { name, code } = req.body;
        const organizationId = req.user.organizationId;

        // verifying unit code is unique within the organization context
        const existingUnit = await this.unitDao.findOne({
            organizationId,
            code: code.toUpperCase()
        });

        if (existingUnit) {

            throw new Conflict("Unit code already exists in your organization.");

        }

        // creating unit record using unit dao
        const unit = await this.unitDao.create({
            organizationId,
            name,
            code: code.toUpperCase()
        });

        // returning the created unit
        return Created(res, "Unit created successfully", unit);

    }

    listUnits = async (req, res) => {
        const organizationId = req.user.organizationId;
        const filter = { organizationId };
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const sortBy = req.query.sortBy || "createdAt";
        const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
        const total = await this.unitDao.Model.countDocuments(filter);
        const items = await this.unitDao.find(filter, { sort: { [sortBy]: sortOrder }, limit, skip });
        return res.status(200).json({ success: true, status: 200, message: "Units retrieved successfully", data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    }

}

export default UnitsController;
