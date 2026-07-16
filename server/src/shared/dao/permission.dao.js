// Importing modules
import Permission from "../models/permission.model.js";

// class to handle permission data access operations
class PermissionDao {

    constructor() {

        // initializing the permission model
        this.Model = Permission;

    }

    // function to create a new permission
    async create(data, session = null) {

        // creating a new permission using the permission model and returning the created permission
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a permission by id
    async findById(id, session = null) {

        // finding a permission by id using the permission model and returning the found permission
        return await this.Model.findById(id).session(session);

    }

    // function to find a permission matching filter
    async findOne(filter, session = null) {

        // finding a permission matching filter using the permission model and returning the found permission
        return await this.Model.findOne(filter).session(session);

    }

    // function to find permissions matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding permissions matching filter using the permission model and returning the found permissions
        let query = this.Model.find(filter).session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a permission by id
    async updateById(id, updateData, session = null) {

        // updating a permission by id using the permission model and returning the updated permission
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        });

    }

    // function to delete a permission by id
    async deleteById(id, session = null) {

        // deleting a permission by id using the permission model and returning the deleted permission
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the permission DAO
export default PermissionDao;
