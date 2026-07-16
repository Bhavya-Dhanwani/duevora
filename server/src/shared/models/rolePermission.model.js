import mongoose from "mongoose";

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

// Compound unique index to prevent duplicate permissions on a role
rolePermissionSchema.index({ roleId: 1, permissionId: 1 }, { unique: true });

const RolePermission = mongoose.model("RolePermission", rolePermissionSchema);

export default RolePermission;
