// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the department model
// defining the schema for the department model
const departmentSchema = new mongoose.Schema({

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },

    name: {
        type: String,
        required: [true, "Department name is required"],
    },

    code: {
        type: String,
        required: [true, "Department code is required"],
        trim: true,
        uppercase: true,
    },

    managerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
    }

}, {
    timestamps: true
});

// adding index for the department schema
departmentSchema.index({ organizationId: 1, code: 1 }, { unique: true });

// making the model for the department schema
const Department = mongoose.model("Department", departmentSchema);

// exporting the department model
export default Department;
