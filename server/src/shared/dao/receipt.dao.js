// Importing modules
import Receipt from "../models/receipt.model.js";

// class to handle receipt data access operations
class ReceiptDao {

    constructor() {

        // initializing the receipt model
        this.Model = Receipt;

    }

    // function to create a new receipt
    async create(data, session = null) {

        // creating a new receipt using the receipt model and returning the created receipt
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a receipt by id
    async findById(id, session = null) {

        // finding a receipt by id using the receipt model and returning the found receipt
        return await this.Model.findById(id).populate("organizationId customerId invoiceId accountId").session(session);

    }

    // function to find a receipt matching filter
    async findOne(filter, session = null) {

        // finding a receipt matching filter using the receipt model and returning the found receipt
        return await this.Model.findOne(filter).populate("organizationId customerId invoiceId accountId").session(session);

    }

    // function to find receipts matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding receipts matching filter using the receipt model and returning the found receipts
        let query = this.Model.find(filter).populate("organizationId customerId invoiceId accountId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a receipt by id
    async updateById(id, updateData, session = null) {

        // updating a receipt by id using the receipt model and returning the updated receipt
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId customerId invoiceId accountId");

    }

    // function to delete a receipt by id
    async deleteById(id, session = null) {

        // deleting a receipt by id using the receipt model and returning the deleted receipt
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the receipt DAO
export default ReceiptDao;
