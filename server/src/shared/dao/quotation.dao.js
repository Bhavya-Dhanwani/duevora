// Importing modules
import Quotation from "../models/quotation.model.js";

// class to handle quotation data access operations
class QuotationDao {

    constructor() {

        // initializing the quotation model
        this.Model = Quotation;

    }

    // function to create a new quotation
    async create(data, session = null) {

        // creating a new quotation using the quotation model and returning the created quotation
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a quotation by id
    async findById(id, session = null) {

        // finding a quotation by id using the quotation model and returning the found quotation
        return await this.Model.findById(id).populate("organizationId customerId").session(session);

    }

    // function to find a quotation matching filter
    async findOne(filter, session = null) {

        // finding a quotation matching filter using the quotation model and returning the found quotation
        return await this.Model.findOne(filter).populate("organizationId customerId").session(session);

    }

    // function to find quotations matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding quotations matching filter using the quotation model and returning the found quotations
        let query = this.Model.find(filter).populate("organizationId customerId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a quotation by id
    async updateById(id, updateData, session = null) {

        // updating a quotation by id using the quotation model and returning the updated quotation
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId customerId");

    }

    // function to delete a quotation by id
    async deleteById(id, session = null) {

        // deleting a quotation by id using the quotation model and returning the deleted quotation
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the quotation DAO
export default QuotationDao;
