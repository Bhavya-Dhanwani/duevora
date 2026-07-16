// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the permission model
// defining the schema for the permission model
const permissionSchema = new mongoose.Schema({

    name: {
        type: String,
        required: [true, "Permission name is required"],
        unique: true,
        trim: true,
    },

    code: {
        type: String,
        required: [true, "Permission code is required"],
        unique: true,
        trim: true,
        uppercase: true,
    },

    module: {
        type: String,
        required: [true, "Module is required"],
        trim: true,
    },

    description: {
        type: String,
    }

}, {
    timestamps: true
});

// making the model for the permission schema
const Permission = mongoose.model("Permission", permissionSchema);

// exporting the permission model
export default Permission;
