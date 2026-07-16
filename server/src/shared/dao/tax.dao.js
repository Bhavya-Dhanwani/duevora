// Importing modules
import Tax from "../models/tax.model.js";

// class to handle tax data access operations
class TaxDao {

    constructor() {

        // initializing the tax model
        this.Model = Tax;

    }

    // function to create a new tax
    async create(data, session = null) {

        // creating a new tax using the tax model and returning the created tax
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a tax by id
    async findById(id, session = null) {

        // finding a tax by id using the tax model and returning the found tax
        return await this.Model.findById(id).populate("organizationId").session(session);

    }

    // function to find a tax matching filter
    async findOne(filter, session = null) {

        // finding a tax matching filter using the tax model and returning the found tax
        return await this.Model.findOne(filter).populate("organizationId").session(session);

    }

    // function to find taxs matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding taxs matching filter using the tax model and returning the found taxs
        let query = this.Model.find(filter).populate("organizationId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a tax by id
    async updateById(id, updateData, session = null) {

        // updating a tax by id using the tax model and returning the updated tax
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId");

    }

    // function to delete a tax by id
    async deleteById(id, session = null) {

        // deleting a tax by id using the tax model and returning the deleted tax
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the tax DAO
export default TaxDao;
