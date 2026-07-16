// Importing modules
import Unit from "../models/unit.model.js";

// class to handle unit data access operations
class UnitDao {

    constructor() {

        // initializing the unit model
        this.Model = Unit;

    }

    // function to create a new unit
    async create(data, session = null) {

        // creating a new unit using the unit model and returning the created unit
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a unit by id
    async findById(id, session = null) {

        // finding a unit by id using the unit model and returning the found unit
        return await this.Model.findById(id).populate("organizationId").session(session);

    }

    // function to find a unit matching filter
    async findOne(filter, session = null) {

        // finding a unit matching filter using the unit model and returning the found unit
        return await this.Model.findOne(filter).populate("organizationId").session(session);

    }

    // function to find units matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding units matching filter using the unit model and returning the found units
        let query = this.Model.find(filter).populate("organizationId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a unit by id
    async updateById(id, updateData, session = null) {

        // updating a unit by id using the unit model and returning the updated unit
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId");

    }

    // function to delete a unit by id
    async deleteById(id, session = null) {

        // deleting a unit by id using the unit model and returning the deleted unit
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the unit DAO
export default UnitDao;
