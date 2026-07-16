// Importing modules
import Employee from "../models/employee.model.js";

// class to handle employee data access operations
class EmployeeDao {

    constructor() {

        // initializing the employee model
        this.Model = Employee;

    }

    // function to create a new employee
    async create(data, session = null) {

        // creating a new employee using the employee model and returning the created employee
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a employee by id
    async findById(id, session = null) {

        // finding a employee by id using the employee model and returning the found employee
        return await this.Model.findById(id).populate("userId organizationId departmentId").session(session);

    }

    // function to find a employee matching filter
    async findOne(filter, session = null) {

        // finding a employee matching filter using the employee model and returning the found employee
        return await this.Model.findOne(filter).populate("userId organizationId departmentId").session(session);

    }

    // function to find employees matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding employees matching filter using the employee model and returning the found employees
        let query = this.Model.find(filter).populate("userId organizationId departmentId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a employee by id
    async updateById(id, updateData, session = null) {

        // updating a employee by id using the employee model and returning the updated employee
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("userId organizationId departmentId");

    }

    // function to delete a employee by id
    async deleteById(id, session = null) {

        // deleting a employee by id using the employee model and returning the deleted employee
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the employee DAO
export default EmployeeDao;
