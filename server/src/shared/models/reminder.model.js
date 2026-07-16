// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the reminder model
// defining the schema for the reminder model
const reminderSchema = new mongoose.Schema({

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },

    title: {
        type: String,
        required: [true, "Reminder title is required"],
        trim: true,
    },

    dueDate: {
        type: Date,
        required: [true, "Due date is required"],
    },

    status: {
        type: String,
        enum: ["pending", "completed"],
        default: "pending",
    },

    invoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Invoice",
    },

    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
    },

    description: {
        type: String,
        trim: true,
    }

}, {
    timestamps: true
});

// making the model for the reminder schema
const Reminder = mongoose.model("Reminder", reminderSchema);

// exporting the reminder model
export default Reminder;
