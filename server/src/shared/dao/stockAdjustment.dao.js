// Importing modules
import StockAdjustment from "../models/stockAdjustment.model.js";

// class to handle stock adjustment data access operations
class StockAdjustmentDao {

    constructor() {

        // initializing the stock adjustment model
        this.Model = StockAdjustment;

    }

    // function to create a new stock adjustment
    async create(data, session = null) {

        // creating a new stock adjustment using the stock adjustment model and returning the created stock adjustment
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a stock adjustment by id
    async findById(id, session = null) {

        // finding a stock adjustment by id using the stock adjustment model and returning the found stock adjustment
        return await this.Model.findById(id).populate("organizationId warehouseId productId adjustedById").session(session);

    }

    // function to find a stock adjustment matching filter
    async findOne(filter, session = null) {

        // finding a stock adjustment matching filter using the stock adjustment model and returning the found stock adjustment
        return await this.Model.findOne(filter).populate("organizationId warehouseId productId adjustedById").session(session);

    }

    // function to find stock adjustments matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding stock adjustments matching filter using the stock adjustment model and returning the found stock adjustments
        let query = this.Model.find(filter).populate("organizationId warehouseId productId adjustedById").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a stock adjustment by id
    async updateById(id, updateData, session = null) {

        // updating a stock adjustment by id using the stock adjustment model and returning the updated stock adjustment
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId warehouseId productId adjustedById");

    }

    // function to delete a stock adjustment by id
    async deleteById(id, session = null) {

        // deleting a stock adjustment by id using the stock adjustment model and returning the deleted stock adjustment
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the stock adjustment DAO
export default StockAdjustmentDao;
