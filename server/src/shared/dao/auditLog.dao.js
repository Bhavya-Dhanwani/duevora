// Importing modules
import AuditLog from "../models/auditLog.model.js";

// class to handle audit log data access operations
class AuditLogDao {

    constructor() {

        // initializing the audit log model
        this.Model = AuditLog;

    }

    // function to create a new audit log
    async create(data, session = null) {

        // creating a new audit log using the audit log model and returning the created audit log
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a audit log by id
    async findById(id, session = null) {

        // finding a audit log by id using the audit log model and returning the found audit log
        return await this.Model.findById(id).populate("organizationId userId").session(session);

    }

    // function to find a audit log matching filter
    async findOne(filter, session = null) {

        // finding a audit log matching filter using the audit log model and returning the found audit log
        return await this.Model.findOne(filter).populate("organizationId userId").session(session);

    }

    // function to find audit logs matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding audit logs matching filter using the audit log model and returning the found audit logs
        let query = this.Model.find(filter).populate("organizationId userId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a audit log by id
    async updateById(id, updateData, session = null) {

        // updating a audit log by id using the audit log model and returning the updated audit log
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId userId");

    }

    // function to delete a audit log by id
    async deleteById(id, session = null) {

        // deleting a audit log by id using the audit log model and returning the deleted audit log
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the audit log DAO
export default AuditLogDao;
