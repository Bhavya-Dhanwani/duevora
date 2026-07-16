// Importing modules
import OpeningBalance from "../models/openingBalance.model.js";

// class to handle opening balance data access operations
class OpeningBalanceDao {

    constructor() {

        // initializing the opening balance model
        this.Model = OpeningBalance;

    }

    // function to create a new opening balance
    async create(data, session = null) {

        // creating a new opening balance using the opening balance model and returning the created opening balance
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a opening balance by id
    async findById(id, session = null) {

        // finding a opening balance by id using the opening balance model and returning the found opening balance
        return await this.Model.findById(id).populate("organizationId financialYearId accountId").session(session);

    }

    // function to find a opening balance matching filter
    async findOne(filter, session = null) {

        // finding a opening balance matching filter using the opening balance model and returning the found opening balance
        return await this.Model.findOne(filter).populate("organizationId financialYearId accountId").session(session);

    }

    // function to find opening balances matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding opening balances matching filter using the opening balance model and returning the found opening balances
        let query = this.Model.find(filter).populate("organizationId financialYearId accountId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a opening balance by id
    async updateById(id, updateData, session = null) {

        // updating a opening balance by id using the opening balance model and returning the updated opening balance
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId financialYearId accountId");

    }

    // function to delete a opening balance by id
    async deleteById(id, session = null) {

        // deleting a opening balance by id using the opening balance model and returning the deleted opening balance
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the opening balance DAO
export default OpeningBalanceDao;
