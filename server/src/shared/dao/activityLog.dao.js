// Importing modules
import ActivityLog from "../models/activityLog.model.js";

// class to handle activity log data access operations
class ActivityLogDao {

    constructor() {

        // initializing the activity log model
        this.Model = ActivityLog;

    }

    // function to create a new activity log
    async create(data, session = null) {

        // creating a new activity log using the activity log model and returning the created activity log
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a activity log by id
    async findById(id, session = null) {

        // finding a activity log by id using the activity log model and returning the found activity log
        return await this.Model.findById(id).populate("organizationId userId").session(session);

    }

    // function to find a activity log matching filter
    async findOne(filter, session = null) {

        // finding a activity log matching filter using the activity log model and returning the found activity log
        return await this.Model.findOne(filter).populate("organizationId userId").session(session);

    }

    // function to find activity logs matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding activity logs matching filter using the activity log model and returning the found activity logs
        let query = this.Model.find(filter).populate("organizationId userId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a activity log by id
    async updateById(id, updateData, session = null) {

        // updating a activity log by id using the activity log model and returning the updated activity log
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId userId");

    }

    // function to delete a activity log by id
    async deleteById(id, session = null) {

        // deleting a activity log by id using the activity log model and returning the deleted activity log
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the activity log DAO
export default ActivityLogDao;
