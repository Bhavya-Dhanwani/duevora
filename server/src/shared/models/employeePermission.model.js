// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the employee permission model
// defining the schema for the employee permission model
const employeePermissionSchema = new mongoose.Schema({

    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        required: [true, "Employee is required"],
    },

    permissionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Permission",
        required: [true, "Permission is required"],
    },

    type: {
        type: String,
        enum: ["grant", "deny"],
        default: "grant",
    }

}, {
    timestamps: true
});

// adding index for the employee permission schema
employeePermissionSchema.index({ employeeId: 1, permissionId: 1 }, { unique: true });

// making the model for the employee permission schema
const EmployeePermission = mongoose.model("EmployeePermission", employeePermissionSchema);

// exporting the employee permission model
export default EmployeePermission;
