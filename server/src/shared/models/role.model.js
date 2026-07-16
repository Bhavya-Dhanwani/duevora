// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the role model
// defining the schema for the role model
const roleSchema = new mongoose.Schema({

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },

    name: {
        type: String,
        required: [true, "Role name is required"],
    },

    code: {
        type: String,
        required: [true, "Role code is required"],
        trim: true,
        uppercase: true,
    },

    description: {
        type: String,
    }

}, {
    timestamps: true
});

// adding index for the role schema
roleSchema.index({ organizationId: 1, code: 1 }, { unique: true });

// making the model for the role schema
const Role = mongoose.model("Role", roleSchema);

// exporting the role model
export default Role;
