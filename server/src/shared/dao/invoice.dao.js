// Importing modules
import Invoice from "../models/invoice.model.js";

// class to handle invoice data access operations
class InvoiceDao {

    constructor() {

        // initializing the invoice model
        this.Model = Invoice;

    }

    // function to create a new invoice
    async create(data, session = null) {

        // creating a new invoice using the invoice model and returning the created invoice
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a invoice by id
    async findById(id, session = null) {

        // finding a invoice by id using the invoice model and returning the found invoice
        return await this.Model.findById(id).populate("organizationId customerId").session(session);

    }

    // function to find a invoice matching filter
    async findOne(filter, session = null) {

        // finding a invoice matching filter using the invoice model and returning the found invoice
        return await this.Model.findOne(filter).populate("organizationId customerId").session(session);

    }

    // function to find invoices matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding invoices matching filter using the invoice model and returning the found invoices
        let query = this.Model.find(filter).populate("organizationId customerId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a invoice by id
    async updateById(id, updateData, session = null) {

        // updating a invoice by id using the invoice model and returning the updated invoice
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId customerId");

    }

    // function to delete a invoice by id
    async deleteById(id, session = null) {

        // deleting a invoice by id using the invoice model and returning the deleted invoice
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the invoice DAO
export default InvoiceDao;
