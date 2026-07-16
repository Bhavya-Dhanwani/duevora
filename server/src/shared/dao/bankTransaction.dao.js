// Importing modules
import BankTransaction from "../models/bankTransaction.model.js";

// class to handle bank transaction data access operations
class BankTransactionDao {

    constructor() {

        // initializing the bank transaction model
        this.Model = BankTransaction;

    }

    // function to create a new bank transaction
    async create(data, session = null) {

        // creating a new bank transaction using the bank transaction model and returning the created bank transaction
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a bank transaction by id
    async findById(id, session = null) {

        // finding a bank transaction by id using the bank transaction model and returning the found bank transaction
        return await this.Model.findById(id).populate("organizationId bankAccountId").session(session);

    }

    // function to find a bank transaction matching filter
    async findOne(filter, session = null) {

        // finding a bank transaction matching filter using the bank transaction model and returning the found bank transaction
        return await this.Model.findOne(filter).populate("organizationId bankAccountId").session(session);

    }

    // function to find bank transactions matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding bank transactions matching filter using the bank transaction model and returning the found bank transactions
        let query = this.Model.find(filter).populate("organizationId bankAccountId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a bank transaction by id
    async updateById(id, updateData, session = null) {

        // updating a bank transaction by id using the bank transaction model and returning the updated bank transaction
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId bankAccountId");

    }

    // function to delete a bank transaction by id
    async deleteById(id, session = null) {

        // deleting a bank transaction by id using the bank transaction model and returning the deleted bank transaction
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the bank transaction DAO
export default BankTransactionDao;
