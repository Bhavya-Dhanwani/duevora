// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the employee role model
// defining the schema for the employee role model
const employeeRoleSchema = new mongoose.Schema({

    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        required: [true, "Employee is required"],
    },

    roleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
        required: [true, "Role is required"],
    }

}, {
    timestamps: true
});

// adding index for the employee role schema
employeeRoleSchema.index({ employeeId: 1, roleId: 1 }, { unique: true });

// making the model for the employee role schema
const EmployeeRole = mongoose.model("EmployeeRole", employeeRoleSchema);

// exporting the employee role model
export default EmployeeRole;
