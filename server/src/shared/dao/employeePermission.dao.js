// Importing modules
import EmployeePermission from "../models/employeePermission.model.js";

// class to handle employee permission data access operations
class EmployeePermissionDao {

    constructor() {

        // initializing the employee permission model
        this.Model = EmployeePermission;

    }

    // function to create a new employee permission
    async create(data, session = null) {

        // creating a new employee permission using the employee permission model and returning the created employee permission
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a employee permission by id
    async findById(id, session = null) {

        // finding a employee permission by id using the employee permission model and returning the found employee permission
        return await this.Model.findById(id).populate("employeeId permissionId").session(session);

    }

    // function to find a employee permission matching filter
    async findOne(filter, session = null) {

        // finding a employee permission matching filter using the employee permission model and returning the found employee permission
        return await this.Model.findOne(filter).populate("employeeId permissionId").session(session);

    }

    // function to find employee permissions matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding employee permissions matching filter using the employee permission model and returning the found employee permissions
        let query = this.Model.find(filter).populate("employeeId permissionId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a employee permission by id
    async updateById(id, updateData, session = null) {

        // updating a employee permission by id using the employee permission model and returning the updated employee permission
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("employeeId permissionId");

    }

    // function to delete a employee permission by id
    async deleteById(id, session = null) {

        // deleting a employee permission by id using the employee permission model and returning the deleted employee permission
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the employee permission DAO
export default EmployeePermissionDao;
