// Importing modules
import BankAccount from "../models/bankAccount.model.js";

// class to handle bank account data access operations
class BankAccountDao {

    constructor() {

        // initializing the bank account model
        this.Model = BankAccount;

    }

    // function to create a new bank account
    async create(data, session = null) {

        // creating a new bank account using the bank account model and returning the created bank account
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a bank account by id
    async findById(id, session = null) {

        // finding a bank account by id using the bank account model and returning the found bank account
        return await this.Model.findById(id).populate("organizationId accountId").session(session);

    }

    // function to find a bank account matching filter
    async findOne(filter, session = null) {

        // finding a bank account matching filter using the bank account model and returning the found bank account
        return await this.Model.findOne(filter).populate("organizationId accountId").session(session);

    }

    // function to find bank accounts matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding bank accounts matching filter using the bank account model and returning the found bank accounts
        let query = this.Model.find(filter).populate("organizationId accountId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a bank account by id
    async updateById(id, updateData, session = null) {

        // updating a bank account by id using the bank account model and returning the updated bank account
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId accountId");

    }

    // function to delete a bank account by id
    async deleteById(id, session = null) {

        // deleting a bank account by id using the bank account model and returning the deleted bank account
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the bank account DAO
export default BankAccountDao;
