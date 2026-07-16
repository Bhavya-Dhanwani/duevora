// Importing modules
import Purchase from "../models/purchase.model.js";

// class to handle purchase data access operations
class PurchaseDao {

    constructor() {

        // initializing the purchase model
        this.Model = Purchase;

    }

    // function to create a new purchase
    async create(data, session = null) {

        // creating a new purchase using the purchase model and returning the created purchase
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a purchase by id
    async findById(id, session = null) {

        // finding a purchase by id using the purchase model and returning the found purchase
        return await this.Model.findById(id).populate("organizationId vendorId").session(session);

    }

    // function to find a purchase matching filter
    async findOne(filter, session = null) {

        // finding a purchase matching filter using the purchase model and returning the found purchase
        return await this.Model.findOne(filter).populate("organizationId vendorId").session(session);

    }

    // function to find purchases matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding purchases matching filter using the purchase model and returning the found purchases
        let query = this.Model.find(filter).populate("organizationId vendorId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a purchase by id
    async updateById(id, updateData, session = null) {

        // updating a purchase by id using the purchase model and returning the updated purchase
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId vendorId");

    }

    // function to delete a purchase by id
    async deleteById(id, session = null) {

        // deleting a purchase by id using the purchase model and returning the deleted purchase
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the purchase DAO
export default PurchaseDao;
