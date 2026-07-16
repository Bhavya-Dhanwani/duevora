// Importing modules
import ExchangeRate from "../models/exchangeRate.model.js";

// class to handle exchange rate data access operations
class ExchangeRateDao {

    constructor() {

        // initializing the exchange rate model
        this.Model = ExchangeRate;

    }

    // function to create a new exchange rate
    async create(data, session = null) {

        // creating a new exchange rate using the exchange rate model and returning the created exchange rate
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a exchange rate by id
    async findById(id, session = null) {

        // finding a exchange rate by id using the exchange rate model and returning the found exchange rate
        return await this.Model.findById(id).populate("organizationId currencyId").session(session);

    }

    // function to find a exchange rate matching filter
    async findOne(filter, session = null) {

        // finding a exchange rate matching filter using the exchange rate model and returning the found exchange rate
        return await this.Model.findOne(filter).populate("organizationId currencyId").session(session);

    }

    // function to find exchange rates matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding exchange rates matching filter using the exchange rate model and returning the found exchange rates
        let query = this.Model.find(filter).populate("organizationId currencyId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a exchange rate by id
    async updateById(id, updateData, session = null) {

        // updating a exchange rate by id using the exchange rate model and returning the updated exchange rate
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId currencyId");

    }

    // function to delete a exchange rate by id
    async deleteById(id, session = null) {

        // deleting a exchange rate by id using the exchange rate model and returning the deleted exchange rate
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the exchange rate DAO
export default ExchangeRateDao;
