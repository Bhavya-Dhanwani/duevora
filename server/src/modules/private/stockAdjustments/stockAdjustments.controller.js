// Importing modules
import StockAdjustmentDao from "../../../shared/dao/stockAdjustment.dao.js";
import ProductDao from "../../../shared/dao/product.dao.js";
import WarehouseDao from "../../../shared/dao/warehouse.dao.js";
import EmployeeDao from "../../../shared/dao/employee.dao.js";
import NotFound from "../../../shared/errors/NotFound.error.js";
import Created from "../../../shared/responses/Created.response.js";

// class to handle stock adjustment operations
class StockAdjustmentsController {

    constructor() {

        // initializing the daos
        this.stockAdjustmentDao = new StockAdjustmentDao();
        this.productDao = new ProductDao();
        this.warehouseDao = new WarehouseDao();
        this.employeeDao = new EmployeeDao();

    }

    // create a new stock adjustment
    createStockAdjustment = async (req, res) => {

        const { warehouseId, productId, adjustedQuantity, reason, date } = req.body;
        const organizationId = req.user.organizationId;

        // fetching caller's employee profile matching their user id
        const employee = await this.employeeDao.findOne({
            userId: req.user._id,
            organizationId
        });

        if (!employee) {

            throw new NotFound("Employee profile not found in your organization.");

        }

        // validating referenced product exists in organization context
        const product = await this.productDao.findOne({
            _id: productId,
            organizationId,
            isDeleted: {
                $ne: true
            }
        });

        if (!product) {

            throw new NotFound("Product not found in your organization.");

        }

        // validating referenced warehouse exists in organization context
        const warehouse = await this.warehouseDao.findOne({
            _id: warehouseId,
            organizationId
        });

        if (!warehouse) {

            throw new NotFound("Warehouse not found in your organization.");

        }

        // creating stock adjustment record using stock adjustment dao (default status Draft)
        const adjustment = await this.stockAdjustmentDao.create({
            organizationId,
            warehouseId,
            productId,
            adjustedQuantity,
            reason: reason || "",
            date: date ? new Date(date) : undefined,
            adjustedById: employee._id,
            status: "Draft"
        });

        return Created(res, "Stock adjustment created successfully", adjustment);

    }

}

export default StockAdjustmentsController;
