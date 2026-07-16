// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the role permission model
// defining the schema for the role permission model
const rolePermissionSchema = new mongoose.Schema({

    roleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
        required: [true, "Role is required"],
    },

    permissionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Permission",
        required: [true, "Permission is required"],
    }

}, {
    timestamps: true
});

// adding index for the role permission schema
rolePermissionSchema.index({ roleId: 1, permissionId: 1 }, { unique: true });

// making the model for the role permission schema
const RolePermission = mongoose.model("RolePermission", rolePermissionSchema);

// exporting the role permission model
export default RolePermission;
