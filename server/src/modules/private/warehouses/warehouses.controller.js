// Importing modules
import WarehouseDao from "../../../shared/dao/warehouse.dao.js";

import Conflict from "../../../shared/errors/Conflict.error.js";

import Created from "../../../shared/responses/Created.response.js";
import Ok from "../../../shared/responses/Ok.response.js";

// class to handle warehouse operations
class WarehousesController {

    constructor() {

        // initializing the warehouse dao
        this.warehouseDao = new WarehouseDao();

    }

    // create a new warehouse
    createWarehouse = async (req, res) => {

        const { name, code, address, status } = req.body;
        const organizationId = req.user.organizationId;

        // verifying warehouse code is unique within the organization context
        const existingWarehouse = await this.warehouseDao.findOne({
            organizationId,
            code: code.toUpperCase()
        });

        if (existingWarehouse) {

            throw new Conflict("Warehouse code already exists in your organization.");

        }

        // creating warehouse record using warehouse dao
        const warehouse = await this.warehouseDao.create({
            organizationId,
            name,
            code: code.toUpperCase(),
            address: address || "",
            status: status || "active"
        });

        // returning the created warehouse
        return Created(res, "Warehouse created successfully", warehouse);

    }

    // list warehouses in the current organization
    listWarehouses = async (req, res) => {

        const organizationId = req.user.organizationId;

        // finding warehouses in the current organization using warehouse dao
        const warehouses = await this.warehouseDao.find({ organizationId });

        // returning the list of warehouses
        return Ok(res, "Warehouses retrieved successfully", warehouses);

    }

}

export default WarehousesController;
