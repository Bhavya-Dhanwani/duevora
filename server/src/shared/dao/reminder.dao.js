// Importing modules
import Reminder from "../models/reminder.model.js";

// class to handle reminder data access operations
class ReminderDao {

    constructor() {

        // initializing the reminder model
        this.Model = Reminder;

    }

    // function to create a new reminder
    async create(data, session = null) {

        // creating a new reminder using the reminder model and returning the created reminder
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a reminder by id
    async findById(id, session = null) {

        // finding a reminder by id using the reminder model and returning the found reminder
        return await this.Model.findById(id).populate("organizationId invoiceId paymentId").session(session);

    }

    // function to find a reminder matching filter
    async findOne(filter, session = null) {

        // finding a reminder matching filter using the reminder model and returning the found reminder
        return await this.Model.findOne(filter).populate("organizationId invoiceId paymentId").session(session);

    }

    // function to find reminders matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding reminders matching filter using the reminder model and returning the found reminders
        let query = this.Model.find(filter).populate("organizationId invoiceId paymentId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a reminder by id
    async updateById(id, updateData, session = null) {

        // updating a reminder by id using the reminder model and returning the updated reminder
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId invoiceId paymentId");

    }

    // function to delete a reminder by id
    async deleteById(id, session = null) {

        // deleting a reminder by id using the reminder model and returning the deleted reminder
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the reminder DAO
export default ReminderDao;
