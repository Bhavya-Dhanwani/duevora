// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the notification model
// defining the schema for the notification model
const notificationSchema = new mongoose.Schema({

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

    title: {
        type: String,
        required: [true, "Notification title is required"],
        trim: true,
    },

    message: {
        type: String,
        required: [true, "Notification message is required"],
        trim: true,
    },

    isRead: {
        type: Boolean,
        default: false,
    },

    type: {
        type: String,
        trim: true,
        default: "system",
    }

}, {
    timestamps: true
});

// making the model for the notification schema
const Notification = mongoose.model("Notification", notificationSchema);

// exporting the notification model
export default Notification;
