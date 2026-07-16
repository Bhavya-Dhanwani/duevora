// Importing modules
import PurchaseOrder from "../models/purchaseOrder.model.js";

// class to handle purchase order data access operations
class PurchaseOrderDao {

    constructor() {

        // initializing the purchase order model
        this.Model = PurchaseOrder;

    }

    // function to create a new purchase order
    async create(data, session = null) {

        // creating a new purchase order using the purchase order model and returning the created purchase order
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a purchase order by id
    async findById(id, session = null) {

        // finding a purchase order by id using the purchase order model and returning the found purchase order
        return await this.Model.findById(id).populate("organizationId vendorId").session(session);

    }

    // function to find a purchase order matching filter
    async findOne(filter, session = null) {

        // finding a purchase order matching filter using the purchase order model and returning the found purchase order
        return await this.Model.findOne(filter).populate("organizationId vendorId").session(session);

    }

    // function to find purchase orders matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding purchase orders matching filter using the purchase order model and returning the found purchase orders
        let query = this.Model.find(filter).populate("organizationId vendorId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a purchase order by id
    async updateById(id, updateData, session = null) {

        // updating a purchase order by id using the purchase order model and returning the updated purchase order
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId vendorId");

    }

    // function to delete a purchase order by id
    async deleteById(id, session = null) {

        // deleting a purchase order by id using the purchase order model and returning the deleted purchase order
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the purchase order DAO
export default PurchaseOrderDao;
