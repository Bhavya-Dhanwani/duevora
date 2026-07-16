// Importing modules
import CostCenter from "../models/costCenter.model.js";

// class to handle cost center data access operations
class CostCenterDao {

    constructor() {

        // initializing the cost center model
        this.Model = CostCenter;

    }

    // function to create a new cost center
    async create(data, session = null) {

        // creating a new cost center using the cost center model and returning the created cost center
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a cost center by id
    async findById(id, session = null) {

        // finding a cost center by id using the cost center model and returning the found cost center
        return await this.Model.findById(id).populate("organizationId").session(session);

    }

    // function to find a cost center matching filter
    async findOne(filter, session = null) {

        // finding a cost center matching filter using the cost center model and returning the found cost center
        return await this.Model.findOne(filter).populate("organizationId").session(session);

    }

    // function to find cost centers matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding cost centers matching filter using the cost center model and returning the found cost centers
        let query = this.Model.find(filter).populate("organizationId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a cost center by id
    async updateById(id, updateData, session = null) {

        // updating a cost center by id using the cost center model and returning the updated cost center
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId");

    }

    // function to delete a cost center by id
    async deleteById(id, session = null) {

        // deleting a cost center by id using the cost center model and returning the deleted cost center
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the cost center DAO
export default CostCenterDao;
