// Importing modules
import Role from "../models/role.model.js";

// class to handle role data access operations
class RoleDao {

    constructor() {

        // initializing the role model
        this.Model = Role;

    }

    // function to create a new role
    async create(data, session = null) {

        // creating a new role using the role model and returning the created role
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a role by id
    async findById(id, session = null) {

        // finding a role by id using the role model and returning the found role
        return await this.Model.findById(id).populate("organizationId").session(session);

    }

    // function to find a role matching filter
    async findOne(filter, session = null) {

        // finding a role matching filter using the role model and returning the found role
        return await this.Model.findOne(filter).populate("organizationId").session(session);

    }

    // function to find roles matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding roles matching filter using the role model and returning the found roles
        let query = this.Model.find(filter).populate("organizationId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a role by id
    async updateById(id, updateData, session = null) {

        // updating a role by id using the role model and returning the updated role
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId");

    }

    // function to delete a role by id
    async deleteById(id, session = null) {

        // deleting a role by id using the role model and returning the deleted role
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the role DAO
export default RoleDao;
