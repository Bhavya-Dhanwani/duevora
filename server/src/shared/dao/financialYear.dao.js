// Importing modules
import FinancialYear from "../models/financialYear.model.js";

// class to handle financial year data access operations
class FinancialYearDao {

    constructor() {

        // initializing the financial year model
        this.Model = FinancialYear;

    }

    // function to create a new financial year
    async create(data, session = null) {

        // creating a new financial year using the financial year model and returning the created financial year
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a financial year by id
    async findById(id, session = null) {

        // finding a financial year by id using the financial year model and returning the found financial year
        return await this.Model.findById(id).populate("organizationId").session(session);

    }

    // function to find a financial year matching filter
    async findOne(filter, session = null) {

        // finding a financial year matching filter using the financial year model and returning the found financial year
        return await this.Model.findOne(filter).populate("organizationId").session(session);

    }

    // function to find financial years matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding financial years matching filter using the financial year model and returning the found financial years
        let query = this.Model.find(filter).populate("organizationId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a financial year by id
    async updateById(id, updateData, session = null) {

        // updating a financial year by id using the financial year model and returning the updated financial year
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId");

    }

    // function to delete a financial year by id
    async deleteById(id, session = null) {

        // deleting a financial year by id using the financial year model and returning the deleted financial year
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the financial year DAO
export default FinancialYearDao;
