// Importing modules
import InventoryDao from "../../../shared/dao/inventory.dao.js";

// class to handle inventory operations
class InventoryController {

    constructor() {

        // initializing the inventory dao
        this.inventoryDao = new InventoryDao();

    }

    // list inventory levels
    listInventory = async (req, res) => {

        const organizationId = req.user.organizationId;
        const { productId, warehouseId } = req.query;

        // formulating filter based on organization isolation
        const filter = {
            organizationId
        };

        if (productId) {

            filter.productId = productId;

        }

        if (warehouseId) {

            filter.warehouseId = warehouseId;

        }

        // parsing pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // counting total matching documents
        const total = await this.inventoryDao.Model.countDocuments(filter);

        // fetching inventory records using inventory dao
        const inventory = await this.inventoryDao.find(filter, {
            limit,
            skip
        });

        // constructing pagination metadata
        const pages = Math.ceil(total / limit);

        return res.status(200).json({
            success: true,
            status: 200,
            message: "Inventory levels retrieved successfully",
            data: inventory,
            pagination: {
                page,
                limit,
                total,
                pages
            }
        });

    }

}

export default InventoryController;
