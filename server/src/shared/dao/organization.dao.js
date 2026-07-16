// Importing modules
import Organization from "../models/organization.model.js";

// class to handle organization data access operations
class OrganizationDao {

    constructor() {

        // initializing the organization model
        this.Model = Organization;

    }

    // function to create a new organization
    async create(data, session = null) {

        // creating a new organization using the organization model and returning the created organization
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a organization by id
    async findById(id, session = null) {

        // finding a organization by id using the organization model and returning the found organization
        return await this.Model.findById(id).session(session);

    }

    // function to find a organization matching filter
    async findOne(filter, session = null) {

        // finding a organization matching filter using the organization model and returning the found organization
        return await this.Model.findOne(filter).session(session);

    }

    // function to find organizations matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding organizations matching filter using the organization model and returning the found organizations
        let query = this.Model.find(filter).session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a organization by id
    async updateById(id, updateData, session = null) {

        // updating a organization by id using the organization model and returning the updated organization
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        });

    }

    // function to delete a organization by id
    async deleteById(id, session = null) {

        // deleting a organization by id using the organization model and returning the deleted organization
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the organization DAO
export default OrganizationDao;
