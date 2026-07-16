// Importing modules
import Notification from "../models/notification.model.js";

// class to handle notification data access operations
class NotificationDao {

    constructor() {

        // initializing the notification model
        this.Model = Notification;

    }

    // function to create a new notification
    async create(data, session = null) {

        // creating a new notification using the notification model and returning the created notification
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a notification by id
    async findById(id, session = null) {

        // finding a notification by id using the notification model and returning the found notification
        return await this.Model.findById(id).populate("organizationId userId").session(session);

    }

    // function to find a notification matching filter
    async findOne(filter, session = null) {

        // finding a notification matching filter using the notification model and returning the found notification
        return await this.Model.findOne(filter).populate("organizationId userId").session(session);

    }

    // function to find notifications matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding notifications matching filter using the notification model and returning the found notifications
        let query = this.Model.find(filter).populate("organizationId userId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a notification by id
    async updateById(id, updateData, session = null) {

        // updating a notification by id using the notification model and returning the updated notification
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId userId");

    }

    // function to delete a notification by id
    async deleteById(id, session = null) {

        // deleting a notification by id using the notification model and returning the deleted notification
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the notification DAO
export default NotificationDao;
