// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the employee model
// defining the schema for the employee model
const employeeSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },

    employeeCode: {
        type: String,
        required: [true, "Employee code is required"],
        trim: true,
    },

    firstName: {
        type: String,
        required: [true, "First name is required"],
    },

    lastName: {
        type: String,
        required: [true, "Last name is required"],
    },

    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        match: [/\S+@\S+\.\S+/, "Email is invalid"],
        trim: true,
        lowercase: true,
    },

    phone: {
        type: String,
    },

    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    },

    joiningDate: {
        type: Date,
    },

    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
    }

}, {
    timestamps: true
});

// adding index for the employee schema
employeeSchema.index({ organizationId: 1, employeeCode: 1 }, { unique: true });

// making the model for the employee schema
const Employee = mongoose.model("Employee", employeeSchema);

// exporting the employee model
export default Employee;
