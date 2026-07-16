// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the activity log model
// defining the schema for the activity log model
const activityLogSchema = new mongoose.Schema({

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

    activity: {
        type: String,
        required: [true, "Activity description is required"],
        trim: true,
    },

    ipAddress: {
        type: String,
        trim: true,
    },

    userAgent: {
        type: String,
        trim: true,
    }

}, {
    timestamps: true
});

// making the model for the activity log schema
const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);

// exporting the activity log model
export default ActivityLog;
