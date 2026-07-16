// Importing modules
import EmployeeRole from "../models/employeeRole.model.js";

// class to handle employee role data access operations
class EmployeeRoleDao {

    constructor() {

        // initializing the employee role model
        this.Model = EmployeeRole;

    }

    // function to create a new employee role
    async create(data, session = null) {

        // creating a new employee role using the employee role model and returning the created employee role
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a employee role by id
    async findById(id, session = null) {

        // finding a employee role by id using the employee role model and returning the found employee role
        return await this.Model.findById(id).populate("employeeId roleId").session(session);

    }

    // function to find a employee role matching filter
    async findOne(filter, session = null) {

        // finding a employee role matching filter using the employee role model and returning the found employee role
        return await this.Model.findOne(filter).populate("employeeId roleId").session(session);

    }

    // function to find employee roles matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding employee roles matching filter using the employee role model and returning the found employee roles
        let query = this.Model.find(filter).populate("employeeId roleId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a employee role by id
    async updateById(id, updateData, session = null) {

        // updating a employee role by id using the employee role model and returning the updated employee role
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("employeeId roleId");

    }

    // function to delete a employee role by id
    async deleteById(id, session = null) {

        // deleting a employee role by id using the employee role model and returning the deleted employee role
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the employee role DAO
export default EmployeeRoleDao;
