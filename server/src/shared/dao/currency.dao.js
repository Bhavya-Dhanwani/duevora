// Importing modules
import Currency from "../models/currency.model.js";

// class to handle currency data access operations
class CurrencyDao {

    constructor() {

        // initializing the currency model
        this.Model = Currency;

    }

    // function to create a new currency
    async create(data, session = null) {

        // creating a new currency using the currency model and returning the created currency
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a currency by id
    async findById(id, session = null) {

        // finding a currency by id using the currency model and returning the found currency
        return await this.Model.findById(id).populate("organizationId").session(session);

    }

    // function to find a currency matching filter
    async findOne(filter, session = null) {

        // finding a currency matching filter using the currency model and returning the found currency
        return await this.Model.findOne(filter).populate("organizationId").session(session);

    }

    // function to find currencys matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding currencys matching filter using the currency model and returning the found currencys
        let query = this.Model.find(filter).populate("organizationId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a currency by id
    async updateById(id, updateData, session = null) {

        // updating a currency by id using the currency model and returning the updated currency
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId");

    }

    // function to delete a currency by id
    async deleteById(id, session = null) {

        // deleting a currency by id using the currency model and returning the deleted currency
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the currency DAO
export default CurrencyDao;
