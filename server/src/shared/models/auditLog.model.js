// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the audit log model
// defining the schema for the audit log model
const auditLogSchema = new mongoose.Schema({

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User reference is required"],
    },

    action: {
        type: String,
        required: [true, "Action is required"],
        trim: true,
    },

    entityType: {
        type: String,
        required: [true, "Entity type is required"],
        trim: true,
    },

    entityId: {
        type: String,
        required: [true, "Entity ID is required"],
        trim: true,
    },

    oldValues: {
        type: mongoose.Schema.Types.Mixed,
    },

    newValues: {
        type: mongoose.Schema.Types.Mixed,
    }

}, {
    timestamps: true
});

// making the model for the audit log schema
const AuditLog = mongoose.model("AuditLog", auditLogSchema);

// exporting the audit log model
export default AuditLog;
