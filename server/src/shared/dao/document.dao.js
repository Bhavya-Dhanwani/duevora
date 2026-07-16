// Importing modules
import Document from "../models/document.model.js";

// class to handle document data access operations
class DocumentDao {

    constructor() {

        // initializing the document model
        this.Model = Document;

    }

    // function to create a new document
    async create(data, session = null) {

        // creating a new document using the document model and returning the created document
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a document by id
    async findById(id, session = null) {

        // finding a document by id using the document model and returning the found document
        return await this.Model.findById(id).populate("organizationId generatedBy").session(session);

    }

    // function to find a document matching filter
    async findOne(filter, session = null) {

        // finding a document matching filter using the document model and returning the found document
        return await this.Model.findOne(filter).populate("organizationId generatedBy").session(session);

    }

    // function to find documents matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding documents matching filter using the document model and returning the found documents
        let query = this.Model.find(filter).populate("organizationId generatedBy").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a document by id
    async updateById(id, updateData, session = null) {

        // updating a document by id using the document model and returning the updated document
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId generatedBy");

    }

    // function to delete a document by id
    async deleteById(id, session = null) {

        // deleting a document by id using the document model and returning the deleted document
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the document DAO
export default DocumentDao;
