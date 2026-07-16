// Importing modules
import JournalEntry from "../models/journalEntry.model.js";

// class to handle journal entry data access operations
class JournalEntryDao {

    constructor() {

        // initializing the journal entry model
        this.Model = JournalEntry;

    }

    // function to create a new journal entry
    async create(data, session = null) {

        // creating a new journal entry using the journal entry model and returning the created journal entry
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a journal entry by id
    async findById(id, session = null) {

        // finding a journal entry by id using the journal entry model and returning the found journal entry
        return await this.Model.findById(id).populate("organizationId").session(session);

    }

    // function to find a journal entry matching filter
    async findOne(filter, session = null) {

        // finding a journal entry matching filter using the journal entry model and returning the found journal entry
        return await this.Model.findOne(filter).populate("organizationId").session(session);

    }

    // function to find journal entrys matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding journal entrys matching filter using the journal entry model and returning the found journal entrys
        let query = this.Model.find(filter).populate("organizationId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a journal entry by id
    async updateById(id, updateData, session = null) {

        // updating a journal entry by id using the journal entry model and returning the updated journal entry
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId");

    }

    // function to delete a journal entry by id
    async deleteById(id, session = null) {

        // deleting a journal entry by id using the journal entry model and returning the deleted journal entry
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the journal entry DAO
export default JournalEntryDao;
