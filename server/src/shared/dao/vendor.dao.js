// Importing modules
import Vendor from "../models/vendor.model.js";

// class to handle vendor data access operations
class VendorDao {

    constructor() {

        // initializing the vendor model
        this.Model = Vendor;

    }

    // function to create a new vendor
    async create(data, session = null) {

        // creating a new vendor using the vendor model and returning the created vendor
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a vendor by id
    async findById(id, session = null) {

        // finding a vendor by id using the vendor model and returning the found vendor
        return await this.Model.findById(id).populate("organizationId").session(session);

    }

    // function to find a vendor matching filter
    async findOne(filter, session = null) {

        // finding a vendor matching filter using the vendor model and returning the found vendor
        return await this.Model.findOne(filter).populate("organizationId").session(session);

    }

    // function to find vendors matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding vendors matching filter using the vendor model and returning the found vendors
        let query = this.Model.find(filter).populate("organizationId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a vendor by id
    async updateById(id, updateData, session = null) {

        // updating a vendor by id using the vendor model and returning the updated vendor
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId");

    }

    // function to delete a vendor by id
    async deleteById(id, session = null) {

        // deleting a vendor by id using the vendor model and returning the deleted vendor
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the vendor DAO
export default VendorDao;
