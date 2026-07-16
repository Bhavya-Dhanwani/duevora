// Importing modules
import DeliveryChallan from "../models/deliveryChallan.model.js";

// class to handle delivery challan data access operations
class DeliveryChallanDao {

    constructor() {

        // initializing the delivery challan model
        this.Model = DeliveryChallan;

    }

    // function to create a new delivery challan
    async create(data, session = null) {

        // creating a new delivery challan using the delivery challan model and returning the created delivery challan
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a delivery challan by id
    async findById(id, session = null) {

        // finding a delivery challan by id using the delivery challan model and returning the found delivery challan
        return await this.Model.findById(id).populate("organizationId customerId").session(session);

    }

    // function to find a delivery challan matching filter
    async findOne(filter, session = null) {

        // finding a delivery challan matching filter using the delivery challan model and returning the found delivery challan
        return await this.Model.findOne(filter).populate("organizationId customerId").session(session);

    }

    // function to find delivery challans matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding delivery challans matching filter using the delivery challan model and returning the found delivery challans
        let query = this.Model.find(filter).populate("organizationId customerId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a delivery challan by id
    async updateById(id, updateData, session = null) {

        // updating a delivery challan by id using the delivery challan model and returning the updated delivery challan
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId customerId");

    }

    // function to delete a delivery challan by id
    async deleteById(id, session = null) {

        // deleting a delivery challan by id using the delivery challan model and returning the deleted delivery challan
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the delivery challan DAO
export default DeliveryChallanDao;
