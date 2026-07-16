// Importing modules
import SalesOrder from "../models/salesOrder.model.js";

// class to handle sales order data access operations
class SalesOrderDao {

    constructor() {

        // initializing the sales order model
        this.Model = SalesOrder;

    }

    // function to create a new sales order
    async create(data, session = null) {

        // creating a new sales order using the sales order model and returning the created sales order
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a sales order by id
    async findById(id, session = null) {

        // finding a sales order by id using the sales order model and returning the found sales order
        return await this.Model.findById(id).populate("organizationId customerId").session(session);

    }

    // function to find a sales order matching filter
    async findOne(filter, session = null) {

        // finding a sales order matching filter using the sales order model and returning the found sales order
        return await this.Model.findOne(filter).populate("organizationId customerId").session(session);

    }

    // function to find sales orders matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding sales orders matching filter using the sales order model and returning the found sales orders
        let query = this.Model.find(filter).populate("organizationId customerId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a sales order by id
    async updateById(id, updateData, session = null) {

        // updating a sales order by id using the sales order model and returning the updated sales order
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId customerId");

    }

    // function to delete a sales order by id
    async deleteById(id, session = null) {

        // deleting a sales order by id using the sales order model and returning the deleted sales order
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the sales order DAO
export default SalesOrderDao;
