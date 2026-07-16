// Importing modules
import Department from "../models/department.model.js";

// class to handle department data access operations
class DepartmentDao {

    constructor() {

        // initializing the department model
        this.Model = Department;

    }

    // function to create a new department
    async create(data, session = null) {

        // creating a new department using the department model and returning the created department
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a department by id
    async findById(id, session = null) {

        // finding a department by id using the department model and returning the found department
        return await this.Model.findById(id).populate("organizationId managerId").session(session);

    }

    // function to find a department matching filter
    async findOne(filter, session = null) {

        // finding a department matching filter using the department model and returning the found department
        return await this.Model.findOne(filter).populate("organizationId managerId").session(session);

    }

    // function to find departments matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding departments matching filter using the department model and returning the found departments
        let query = this.Model.find(filter).populate("organizationId managerId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a department by id
    async updateById(id, updateData, session = null) {

        // updating a department by id using the department model and returning the updated department
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId managerId");

    }

    // function to delete a department by id
    async deleteById(id, session = null) {

        // deleting a department by id using the department model and returning the deleted department
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the department DAO
export default DepartmentDao;
