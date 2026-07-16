// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the organization model
// defining the schema for the organization model
const organizationSchema = new mongoose.Schema({

    name: {
        type: String,
        required: [true, "Name is required"],
        minlength: [2, "Name must be at least 2 characters long"],
    },

    code: {
        type: String,
        required: [true, "Code is required"],
        unique: true,
        uppercase: true,
        trim: true,
    },

    address: {
        type: String,
    },

    logo: {
        type: String,
    },

    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    }

}, {
    timestamps: true
});

// making the model for the organization schema
const Organization = mongoose.model("Organization", organizationSchema);

// exporting the organization model
export default Organization;
