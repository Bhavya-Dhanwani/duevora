// Importing modules
import Warehouse from "../models/warehouse.model.js";

// class to handle warehouse data access operations
class WarehouseDao {

    constructor() {

        // initializing the warehouse model
        this.Model = Warehouse;

    }

    // function to create a new warehouse
    async create(data, session = null) {

        // creating a new warehouse using the warehouse model and returning the created warehouse
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a warehouse by id
    async findById(id, session = null) {

        // finding a warehouse by id using the warehouse model and returning the found warehouse
        return await this.Model.findById(id).populate("organizationId").session(session);

    }

    // function to find a warehouse matching filter
    async findOne(filter, session = null) {

        // finding a warehouse matching filter using the warehouse model and returning the found warehouse
        return await this.Model.findOne(filter).populate("organizationId").session(session);

    }

    // function to find warehouses matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding warehouses matching filter using the warehouse model and returning the found warehouses
        let query = this.Model.find(filter).populate("organizationId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a warehouse by id
    async updateById(id, updateData, session = null) {

        // updating a warehouse by id using the warehouse model and returning the updated warehouse
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId");

    }

    // function to delete a warehouse by id
    async deleteById(id, session = null) {

        // deleting a warehouse by id using the warehouse model and returning the deleted warehouse
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the warehouse DAO
export default WarehouseDao;
