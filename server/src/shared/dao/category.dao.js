// Importing modules
import Category from "../models/category.model.js";

// class to handle category data access operations
class CategoryDao {

    constructor() {

        // initializing the category model
        this.Model = Category;

    }

    // function to create a new category
    async create(data, session = null) {

        // creating a new category using the category model and returning the created category
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a category by id
    async findById(id, session = null) {

        // finding a category by id using the category model and returning the found category
        return await this.Model.findById(id).populate("organizationId parentId").session(session);

    }

    // function to find a category matching filter
    async findOne(filter, session = null) {

        // finding a category matching filter using the category model and returning the found category
        return await this.Model.findOne(filter).populate("organizationId parentId").session(session);

    }

    // function to find categorys matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding categorys matching filter using the category model and returning the found categorys
        let query = this.Model.find(filter).populate("organizationId parentId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a category by id
    async updateById(id, updateData, session = null) {

        // updating a category by id using the category model and returning the updated category
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId parentId");

    }

    // function to delete a category by id
    async deleteById(id, session = null) {

        // deleting a category by id using the category model and returning the deleted category
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the category DAO
export default CategoryDao;
