import Document from "../models/document.model.js";

class DocumentDao {
    constructor() {
        this.Model = Document;
    }

    async create(data, session = null) {
        const doc = new this.Model(data);
        return await doc.save({ session });
    }

    async findById(id, session = null) {
        return await this.Model.findById(id).populate("organizationId generatedBy").session(session);
    }

    async findOne(filter, session = null) {
        return await this.Model.findOne(filter).populate("organizationId generatedBy").session(session);
    }

    async find(filter = {}, options = {}, session = null) {
        let query = this.Model.find(filter).populate("organizationId generatedBy").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;
    }

    async updateById(id, updateData, session = null) {
        return await this.Model.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
            session
        }).populate("organizationId generatedBy");
    }

    async deleteById(id, session = null) {
        return await this.Model.findByIdAndDelete(id, { session });
    }
}

export default DocumentDao;
