// Importing modules
import Setting from "../models/setting.model.js";

// class to handle setting data access operations
class SettingDao {

    constructor() {

        // initializing the setting model
        this.Model = Setting;

    }

    // function to create a new setting
    async create(data, session = null) {

        // creating a new setting using the setting model and returning the created setting
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a setting by id
    async findById(id, session = null) {

        // finding a setting by id using the setting model and returning the found setting
        return await this.Model.findById(id).populate("organizationId").session(session);

    }

    // function to find a setting matching filter
    async findOne(filter, session = null) {

        // finding a setting matching filter using the setting model and returning the found setting
        return await this.Model.findOne(filter).populate("organizationId").session(session);

    }

    // function to find settings matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding settings matching filter using the setting model and returning the found settings
        let query = this.Model.find(filter).populate("organizationId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a setting by id
    async updateById(id, updateData, session = null) {

        // updating a setting by id using the setting model and returning the updated setting
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId");

    }

    // function to delete a setting by id
    async deleteById(id, session = null) {

        // deleting a setting by id using the setting model and returning the deleted setting
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the setting DAO
export default SettingDao;
