// Importing modules
import JournalEntryLine from "../models/journalEntryLine.model.js";

// class to handle journal entry line data access operations
class JournalEntryLineDao {

    constructor() {

        // initializing the journal entry line model
        this.Model = JournalEntryLine;

    }

    // function to create a new journal entry line
    async create(data, session = null) {

        // creating a new journal entry line using the journal entry line model and returning the created journal entry line
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a journal entry line by id
    async findById(id, session = null) {

        // finding a journal entry line by id using the journal entry line model and returning the found journal entry line
        return await this.Model.findById(id).populate("journalEntryId accountId").session(session);

    }

    // function to find a journal entry line matching filter
    async findOne(filter, session = null) {

        // finding a journal entry line matching filter using the journal entry line model and returning the found journal entry line
        return await this.Model.findOne(filter).populate("journalEntryId accountId").session(session);

    }

    // function to find journal entry lines matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding journal entry lines matching filter using the journal entry line model and returning the found journal entry lines
        let query = this.Model.find(filter).populate("journalEntryId accountId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a journal entry line by id
    async updateById(id, updateData, session = null) {

        // updating a journal entry line by id using the journal entry line model and returning the updated journal entry line
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("journalEntryId accountId");

    }

    // function to delete a journal entry line by id
    async deleteById(id, session = null) {

        // deleting a journal entry line by id using the journal entry line model and returning the deleted journal entry line
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the journal entry line DAO
export default JournalEntryLineDao;
