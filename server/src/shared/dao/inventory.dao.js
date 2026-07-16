// Importing modules
import Inventory from "../models/inventory.model.js";

// class to handle inventory data access operations
class InventoryDao {

    constructor() {

        // initializing the inventory model
        this.Model = Inventory;

    }

    // function to create a new inventory
    async create(data, session = null) {

        // creating a new inventory using the inventory model and returning the created inventory
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a inventory by id
    async findById(id, session = null) {

        // finding a inventory by id using the inventory model and returning the found inventory
        return await this.Model.findById(id).populate("organizationId productId warehouseId").session(session);

    }

    // function to find a inventory matching filter
    async findOne(filter, session = null) {

        // finding a inventory matching filter using the inventory model and returning the found inventory
        return await this.Model.findOne(filter).populate("organizationId productId warehouseId").session(session);

    }

    // function to find inventorys matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding inventorys matching filter using the inventory model and returning the found inventorys
        let query = this.Model.find(filter).populate("organizationId productId warehouseId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a inventory by id
    async updateById(id, updateData, session = null) {

        // updating a inventory by id using the inventory model and returning the updated inventory
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId productId warehouseId");

    }

    // function to delete a inventory by id
    async deleteById(id, session = null) {

        // deleting a inventory by id using the inventory model and returning the deleted inventory
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the inventory DAO
export default InventoryDao;
