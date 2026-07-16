// Importing modules
import Payment from "../models/payment.model.js";

// class to handle payment data access operations
class PaymentDao {

    constructor() {

        // initializing the payment model
        this.Model = Payment;

    }

    // function to create a new payment
    async create(data, session = null) {

        // creating a new payment using the payment model and returning the created payment
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a payment by id
    async findById(id, session = null) {

        // finding a payment by id using the payment model and returning the found payment
        return await this.Model.findById(id).populate("organizationId vendorId purchaseId accountId").session(session);

    }

    // function to find a payment matching filter
    async findOne(filter, session = null) {

        // finding a payment matching filter using the payment model and returning the found payment
        return await this.Model.findOne(filter).populate("organizationId vendorId purchaseId accountId").session(session);

    }

    // function to find payments matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding payments matching filter using the payment model and returning the found payments
        let query = this.Model.find(filter).populate("organizationId vendorId purchaseId accountId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a payment by id
    async updateById(id, updateData, session = null) {

        // updating a payment by id using the payment model and returning the updated payment
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId vendorId purchaseId accountId");

    }

    // function to delete a payment by id
    async deleteById(id, session = null) {

        // deleting a payment by id using the payment model and returning the deleted payment
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the payment DAO
export default PaymentDao;
