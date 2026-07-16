// Importing modules
import Account from "../models/account.model.js";

// class to handle account data access operations
class AccountDao {

    constructor() {

        // initializing the account model
        this.Model = Account;

    }

    // function to create a new account
    async create(data, session = null) {

        // creating a new account using the account model and returning the created account
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a account by id
    async findById(id, session = null) {

        // finding a account by id using the account model and returning the found account
        return await this.Model.findById(id).populate("organizationId").session(session);

    }

    // function to find a account matching filter
    async findOne(filter, session = null) {

        // finding a account matching filter using the account model and returning the found account
        return await this.Model.findOne(filter).populate("organizationId").session(session);

    }

    // function to find accounts matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding accounts matching filter using the account model and returning the found accounts
        let query = this.Model.find(filter).populate("organizationId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a account by id
    async updateById(id, updateData, session = null) {

        // updating a account by id using the account model and returning the updated account
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId");

    }

    // function to delete a account by id
    async deleteById(id, session = null) {

        // deleting a account by id using the account model and returning the deleted account
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the account DAO
export default AccountDao;
