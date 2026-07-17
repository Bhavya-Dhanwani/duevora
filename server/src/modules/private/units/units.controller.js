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

        return Created(res, "Unit created successfully", unit);

    }

}

export default UnitsController;
