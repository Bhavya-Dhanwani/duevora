// Importing modules
import Income from "../models/income.model.js";

// class to handle income data access operations
class IncomeDao {

    constructor() {

        // initializing the income model
        this.Model = Income;

    }

    // function to create a new income
    async create(data, session = null) {

        // creating a new income using the income model and returning the created income
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a income by id
    async findById(id, session = null) {

        // finding a income by id using the income model and returning the found income
        return await this.Model.findById(id).populate("organizationId categoryId accountId").session(session);

    }

    // function to find a income matching filter
    async findOne(filter, session = null) {

        // finding a income matching filter using the income model and returning the found income
        return await this.Model.findOne(filter).populate("organizationId categoryId accountId").session(session);

    }

    // function to find incomes matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding incomes matching filter using the income model and returning the found incomes
        let query = this.Model.find(filter).populate("organizationId categoryId accountId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a income by id
    async updateById(id, updateData, session = null) {

        // updating a income by id using the income model and returning the updated income
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId categoryId accountId");

    }

    // function to delete a income by id
    async deleteById(id, session = null) {

        // deleting a income by id using the income model and returning the deleted income
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the income DAO
export default IncomeDao;
