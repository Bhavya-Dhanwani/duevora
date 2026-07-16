// Importing modules
import Attachment from "../models/attachment.model.js";

// class to handle attachment data access operations
class AttachmentDao {

    constructor() {

        // initializing the attachment model
        this.Model = Attachment;

    }

    // function to create a new attachment
    async create(data, session = null) {

        // creating a new attachment using the attachment model and returning the created attachment
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a attachment by id
    async findById(id, session = null) {

        // finding a attachment by id using the attachment model and returning the found attachment
        return await this.Model.findById(id).populate("organizationId uploadedBy").session(session);

    }

    // function to find a attachment matching filter
    async findOne(filter, session = null) {

        // finding a attachment matching filter using the attachment model and returning the found attachment
        return await this.Model.findOne(filter).populate("organizationId uploadedBy").session(session);

    }

    // function to find attachments matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding attachments matching filter using the attachment model and returning the found attachments
        let query = this.Model.find(filter).populate("organizationId uploadedBy").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a attachment by id
    async updateById(id, updateData, session = null) {

        // updating a attachment by id using the attachment model and returning the updated attachment
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId uploadedBy");

    }

    // function to delete a attachment by id
    async deleteById(id, session = null) {

        // deleting a attachment by id using the attachment model and returning the deleted attachment
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the attachment DAO
export default AttachmentDao;
