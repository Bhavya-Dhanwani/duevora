// Importing modules
import StockMovement from "../models/stockMovement.model.js";

// class to handle stock movement data access operations
class StockMovementDao {

    constructor() {

        // initializing the stock movement model
        this.Model = StockMovement;

    }

    // function to create a new stock movement
    async create(data, session = null) {

        // creating a new stock movement using the stock movement model and returning the created stock movement
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a stock movement by id
    async findById(id, session = null) {

        // finding a stock movement by id using the stock movement model and returning the found stock movement
        return await this.Model.findById(id).populate("organizationId productId warehouseId").session(session);

    }

    // function to find a stock movement matching filter
    async findOne(filter, session = null) {

        // finding a stock movement matching filter using the stock movement model and returning the found stock movement
        return await this.Model.findOne(filter).populate("organizationId productId warehouseId").session(session);

    }

    // function to find stock movements matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding stock movements matching filter using the stock movement model and returning the found stock movements
        let query = this.Model.find(filter).populate("organizationId productId warehouseId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a stock movement by id
    async updateById(id, updateData, session = null) {

        // updating a stock movement by id using the stock movement model and returning the updated stock movement
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId productId warehouseId");

    }

    // function to delete a stock movement by id
    async deleteById(id, session = null) {

        // deleting a stock movement by id using the stock movement model and returning the deleted stock movement
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the stock movement DAO
export default StockMovementDao;
