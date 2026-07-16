// Importing modules
import VoucherType from "../models/voucherType.model.js";

// class to handle voucher type data access operations
class VoucherTypeDao {

    constructor() {

        // initializing the voucher type model
        this.Model = VoucherType;

    }

    // function to create a new voucher type
    async create(data, session = null) {

        // creating a new voucher type using the voucher type model and returning the created voucher type
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a voucher type by id
    async findById(id, session = null) {

        // finding a voucher type by id using the voucher type model and returning the found voucher type
        return await this.Model.findById(id).populate("organizationId").session(session);

    }

    // function to find a voucher type matching filter
    async findOne(filter, session = null) {

        // finding a voucher type matching filter using the voucher type model and returning the found voucher type
        return await this.Model.findOne(filter).populate("organizationId").session(session);

    }

    // function to find voucher types matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding voucher types matching filter using the voucher type model and returning the found voucher types
        let query = this.Model.find(filter).populate("organizationId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a voucher type by id
    async updateById(id, updateData, session = null) {

        // updating a voucher type by id using the voucher type model and returning the updated voucher type
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId");

    }

    // function to delete a voucher type by id
    async deleteById(id, session = null) {

        // deleting a voucher type by id using the voucher type model and returning the deleted voucher type
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the voucher type DAO
export default VoucherTypeDao;
