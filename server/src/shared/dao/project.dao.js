// Importing modules
import Project from "../models/project.model.js";

// class to handle project data access operations
class ProjectDao {

    constructor() {

        // initializing the project model
        this.Model = Project;

    }

    // function to create a new project
    async create(data, session = null) {

        // creating a new project using the project model and returning the created project
        const doc = new this.Model(data);
        return await doc.save({ session });

    }

    // function to find a project by id
    async findById(id, session = null) {

        // finding a project by id using the project model and returning the found project
        return await this.Model.findById(id).populate("organizationId customerId").session(session);

    }

    // function to find a project matching filter
    async findOne(filter, session = null) {

        // finding a project matching filter using the project model and returning the found project
        return await this.Model.findOne(filter).populate("organizationId customerId").session(session);

    }

    // function to find projects matching filter
    async find(filter = {}, options = {}, session = null) {

        // finding projects matching filter using the project model and returning the found projects
        let query = this.Model.find(filter).populate("organizationId customerId").session(session);
        if (options.sort) query = query.sort(options.sort);
        if (options.limit) query = query.limit(options.limit);
        if (options.skip) query = query.skip(options.skip);
        return await query;

    }

    // function to update a project by id
    async updateById(id, updateData, session = null) {

        // updating a project by id using the project model and returning the updated project
        return await this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session
        }).populate("organizationId customerId");

    }

    // function to delete a project by id
    async deleteById(id, session = null) {

        // deleting a project by id using the project model and returning the deleted project
        return await this.Model.findByIdAndDelete(id, { session });

    }

}

// exporting the project DAO
export default ProjectDao;
