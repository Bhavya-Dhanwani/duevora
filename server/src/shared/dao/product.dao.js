// Importing modules
import Product from "../models/product.model.js";

// class to handle product data access operations
class ProductDao {

    constructor() {

        // initializing the product model
        this.Model = Product;

    }

    // function to create a new product
    async create(data, session = null) {

        // creating a new product using the product model and returning the created product
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a product by id
    async findById(id, session = null) {

        // finding a product by id using the product model and returning the found product
        return await this.Model.findById(id).populate("organizationId categoryId unitId").session(session);

    }

    // function to find a product matching filter
    async findOne(filter, session = null) {

        // finding a product matching filter using the product model and returning the found product
        return await this.Model.findOne(filter).populate("organizationId categoryId unitId").session(session);

    }

    // function to find products matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding products matching filter using the product model and returning the found products
        let query = this.Model.find(filter).populate("organizationId categoryId unitId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a product by id
    async updateById(id, updateData, session = null) {

        // updating a product by id using the product model and returning the updated product
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId categoryId unitId");

    }

    // function to delete a product by id
    async deleteById(id, session = null) {

        // deleting a product by id using the product model and returning the deleted product
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the product DAO
export default ProductDao;
