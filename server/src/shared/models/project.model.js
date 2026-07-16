// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the project model
// defining the schema for the project model
const projectSchema = new mongoose.Schema({

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },

    name: {
        type: String,
        required: [true, "Project name is required"],
        trim: true,
    },

    code: {
        type: String,
        required: [true, "Project code is required"],
        trim: true,
        uppercase: true,
    },

    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
    },

    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    }

}, {
    timestamps: true
});

// adding index for the project schema
projectSchema.index({ organizationId: 1, code: 1 }, { unique: true });

// making the model for the project schema
const Project = mongoose.model("Project", projectSchema);

// exporting the project model
export default Project;
