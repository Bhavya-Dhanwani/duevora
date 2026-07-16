// Importing modules
import LedgerEntry from "../models/ledgerEntry.model.js";

// class to handle ledger entry data access operations
class LedgerEntryDao {

    constructor() {

        // initializing the ledger entry model
        this.Model = LedgerEntry;

    }

    // function to create a new ledger entry
    async create(data, session = null) {

        // creating a new ledger entry using the ledger entry model and returning the created ledger entry
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a ledger entry by id
    async findById(id, session = null) {

        // finding a ledger entry by id using the ledger entry model and returning the found ledger entry
        return await this.Model.findById(id).populate("organizationId accountId journalEntryId").session(session);

    }

    // function to find a ledger entry matching filter
    async findOne(filter, session = null) {

        // finding a ledger entry matching filter using the ledger entry model and returning the found ledger entry
        return await this.Model.findOne(filter).populate("organizationId accountId journalEntryId").session(session);

    }

    // function to find ledger entrys matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding ledger entrys matching filter using the ledger entry model and returning the found ledger entrys
        let query = this.Model.find(filter).populate("organizationId accountId journalEntryId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a ledger entry by id
    async updateById(id, updateData, session = null) {

        // updating a ledger entry by id using the ledger entry model and returning the updated ledger entry
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId accountId journalEntryId");

    }

    // function to delete a ledger entry by id
    async deleteById(id, session = null) {

        // deleting a ledger entry by id using the ledger entry model and returning the deleted ledger entry
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the ledger entry DAO
export default LedgerEntryDao;
