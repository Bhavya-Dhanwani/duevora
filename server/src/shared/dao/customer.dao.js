// Importing modules
import Customer from "../models/customer.model.js";

// class to handle customer data access operations
class CustomerDao {

    constructor() {

        // initializing the customer model
        this.Model = Customer;

    }

    // function to create a new customer
    async create(data, session = null) {

        // creating a new customer using the customer model and returning the created customer
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a customer by id
    async findById(id, session = null) {

        // finding a customer by id using the customer model and returning the found customer
        return await this.Model.findById(id).populate("organizationId").session(session);

    }

    // function to find a customer matching filter
    async findOne(filter, session = null) {

        // finding a customer matching filter using the customer model and returning the found customer
        return await this.Model.findOne(filter).populate("organizationId").session(session);

    }

    // function to find customers matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding customers matching filter using the customer model and returning the found customers
        let query = this.Model.find(filter).populate("organizationId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a customer by id
    async updateById(id, updateData, session = null) {

        // updating a customer by id using the customer model and returning the updated customer
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId");

    }

    // function to delete a customer by id
    async deleteById(id, session = null) {

        // deleting a customer by id using the customer model and returning the deleted customer
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the customer DAO
export default CustomerDao;
