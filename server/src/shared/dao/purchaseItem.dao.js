// Importing modules
import PurchaseItem from "../models/purchaseItem.model.js";

// class to handle purchase item data access operations
class PurchaseItemDao {

    constructor() {

        // initializing the purchase item model
        this.Model = PurchaseItem;

    }

    // function to create a new purchase item
    async create(data, session = null) {

        // creating a new purchase item using the purchase item model and returning the created purchase item
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a purchase item by id
    async findById(id, session = null) {

        // finding a purchase item by id using the purchase item model and returning the found purchase item
        return await this.Model.findById(id).populate("purchaseId productId taxId").session(session);

    }

    // function to find a purchase item matching filter
    async findOne(filter, session = null) {

        // finding a purchase item matching filter using the purchase item model and returning the found purchase item
        return await this.Model.findOne(filter).populate("purchaseId productId taxId").session(session);

    }

    // function to find purchase items matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding purchase items matching filter using the purchase item model and returning the found purchase items
        let query = this.Model.find(filter).populate("purchaseId productId taxId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a purchase item by id
    async updateById(id, updateData, session = null) {

        // updating a purchase item by id using the purchase item model and returning the updated purchase item
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("purchaseId productId taxId");

    }

    // function to delete a purchase item by id
    async deleteById(id, session = null) {

        // deleting a purchase item by id using the purchase item model and returning the deleted purchase item
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the purchase item DAO
export default PurchaseItemDao;
