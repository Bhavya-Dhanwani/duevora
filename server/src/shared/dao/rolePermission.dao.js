// Importing modules
import RolePermission from "../models/rolePermission.model.js";

// class to handle role permission data access operations
class RolePermissionDao {

    constructor() {

        // initializing the role permission model
        this.Model = RolePermission;

    }

    // function to create a new role permission
    async create(data, session = null) {

        // creating a new role permission using the role permission model and returning the created role permission
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a role permission by id
    async findById(id, session = null) {

        // finding a role permission by id using the role permission model and returning the found role permission
        return await this.Model.findById(id).populate("roleId permissionId").session(session);

    }

    // function to find a role permission matching filter
    async findOne(filter, session = null) {

        // finding a role permission matching filter using the role permission model and returning the found role permission
        return await this.Model.findOne(filter).populate("roleId permissionId").session(session);

    }

    // function to find role permissions matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding role permissions matching filter using the role permission model and returning the found role permissions
        let query = this.Model.find(filter).populate("roleId permissionId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a role permission by id
    async updateById(id, updateData, session = null) {

        // updating a role permission by id using the role permission model and returning the updated role permission
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("roleId permissionId");

    }

    // function to delete a role permission by id
    async deleteById(id, session = null) {

        // deleting a role permission by id using the role permission model and returning the deleted role permission
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the role permission DAO
export default RolePermissionDao;
