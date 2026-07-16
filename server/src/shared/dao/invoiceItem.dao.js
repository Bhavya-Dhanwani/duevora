// Importing modules
import InvoiceItem from "../models/invoiceItem.model.js";

// class to handle invoice item data access operations
class InvoiceItemDao {

    constructor() {

        // initializing the invoice item model
        this.Model = InvoiceItem;

    }

    // function to create a new invoice item
    async create(data, session = null) {

        // creating a new invoice item using the invoice item model and returning the created invoice item
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a invoice item by id
    async findById(id, session = null) {

        // finding a invoice item by id using the invoice item model and returning the found invoice item
        return await this.Model.findById(id).populate("invoiceId productId taxId").session(session);

    }

    // function to find a invoice item matching filter
    async findOne(filter, session = null) {

        // finding a invoice item matching filter using the invoice item model and returning the found invoice item
        return await this.Model.findOne(filter).populate("invoiceId productId taxId").session(session);

    }

    // function to find invoice items matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding invoice items matching filter using the invoice item model and returning the found invoice items
        let query = this.Model.find(filter).populate("invoiceId productId taxId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a invoice item by id
    async updateById(id, updateData, session = null) {

        // updating a invoice item by id using the invoice item model and returning the updated invoice item
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("invoiceId productId taxId");

    }

    // function to delete a invoice item by id
    async deleteById(id, session = null) {

        // deleting a invoice item by id using the invoice item model and returning the deleted invoice item
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the invoice item DAO
export default InvoiceItemDao;
