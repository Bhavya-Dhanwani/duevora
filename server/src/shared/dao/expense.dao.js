// Importing modules
import Expense from "../models/expense.model.js";

// class to handle expense data access operations
class ExpenseDao {

    constructor() {

        // initializing the expense model
        this.Model = Expense;

    }

    // function to create a new expense
    async create(data, session = null) {

        // creating a new expense using the expense model and returning the created expense
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a expense by id
    async findById(id, session = null) {

        // finding a expense by id using the expense model and returning the found expense
        return await this.Model.findById(id).populate("organizationId categoryId accountId").session(session);

    }

    // function to find a expense matching filter
    async findOne(filter, session = null) {

        // finding a expense matching filter using the expense model and returning the found expense
        return await this.Model.findOne(filter).populate("organizationId categoryId accountId").session(session);

    }

    // function to find expenses matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding expenses matching filter using the expense model and returning the found expenses
        let query = this.Model.find(filter).populate("organizationId categoryId accountId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a expense by id
    async updateById(id, updateData, session = null) {

        // updating a expense by id using the expense model and returning the updated expense
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId categoryId accountId");

    }

    // function to delete a expense by id
    async deleteById(id, session = null) {

        // deleting a expense by id using the expense model and returning the deleted expense
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the expense DAO
export default ExpenseDao;
