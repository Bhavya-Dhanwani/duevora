// Importing modules
import Budget from "../models/budget.model.js";

// class to handle budget data access operations
class BudgetDao {

    constructor() {

        // initializing the budget model
        this.Model = Budget;

    }

    // function to create a new budget
    async create(data, session = null) {

        // creating a new budget using the budget model and returning the created budget
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a budget by id
    async findById(id, session = null) {

        // finding a budget by id using the budget model and returning the found budget
        return await this.Model.findById(id).populate("organizationId financialYearId accountId").session(session);

    }

    // function to find a budget matching filter
    async findOne(filter, session = null) {

        // finding a budget matching filter using the budget model and returning the found budget
        return await this.Model.findOne(filter).populate("organizationId financialYearId accountId").session(session);

    }

    // function to find budgets matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding budgets matching filter using the budget model and returning the found budgets
        let query = this.Model.find(filter).populate("organizationId financialYearId accountId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a budget by id
    async updateById(id, updateData, session = null) {

        // updating a budget by id using the budget model and returning the updated budget
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId financialYearId accountId");

    }

    // function to delete a budget by id
    async deleteById(id, session = null) {

        // deleting a budget by id using the budget model and returning the deleted budget
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the budget DAO
export default BudgetDao;
