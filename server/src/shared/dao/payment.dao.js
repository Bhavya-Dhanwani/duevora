import Payment from "../models/payment.model.js";

class PaymentDao {
    constructor() {
        this.Model = Payment;
    }

    async create(data, session = null) {
        const doc = new this.Model(data);
        return await doc.save({ session });
    }

    async findById(id, session = null) {
        return await this.Model.findById(id).populate("organizationId vendorId purchaseId accountId").session(session);
    }

    async findOne(filter, session = null) {
        return await this.Model.findOne(filter).populate("organizationId vendorId purchaseId accountId").session(session);
    }

    async find(filter = {}, options = {}, session = null) {
        let query = this.Model.find(filter).populate("organizationId vendorId purchaseId accountId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;
    }

    async updateById(id, updateData, session = null) {
        return await this.Model.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
            session
        }).populate("organizationId vendorId purchaseId accountId");
    }

    async deleteById(id, session = null) {
        return await this.Model.findByIdAndDelete(id, { session });
    }
}

export default PaymentDao;
