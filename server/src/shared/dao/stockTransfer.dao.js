// Importing modules
import StockTransfer from "../models/stockTransfer.model.js";

// class to handle stock transfer data access operations
class StockTransferDao {

    constructor() {

        // initializing the stock transfer model
        this.Model = StockTransfer;

    }

    // function to create a new stock transfer
    async create(data, session = null) {

        // creating a new stock transfer using the stock transfer model and returning the created stock transfer
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a stock transfer by id
    async findById(id, session = null) {

        // finding a stock transfer by id using the stock transfer model and returning the found stock transfer
        return await this.Model.findById(id).populate("organizationId fromWarehouseId toWarehouseId productId").session(session);

    }

    // function to find a stock transfer matching filter
    async findOne(filter, session = null) {

        // finding a stock transfer matching filter using the stock transfer model and returning the found stock transfer
        return await this.Model.findOne(filter).populate("organizationId fromWarehouseId toWarehouseId productId").session(session);

    }

    // function to find stock transfers matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding stock transfers matching filter using the stock transfer model and returning the found stock transfers
        let query = this.Model.find(filter).populate("organizationId fromWarehouseId toWarehouseId productId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a stock transfer by id
    async updateById(id, updateData, session = null) {

        // updating a stock transfer by id using the stock transfer model and returning the updated stock transfer
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId fromWarehouseId toWarehouseId productId");

    }

    // function to delete a stock transfer by id
    async deleteById(id, session = null) {

        // deleting a stock transfer by id using the stock transfer model and returning the deleted stock transfer
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the stock transfer DAO
export default StockTransferDao;
