// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the customer model
// defining the schema for the customer model
const customerSchema = new mongoose.Schema({

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },

    name: {
        type: String,
        required: [true, "Customer name is required"],
        trim: true,
    },

    email: {
        type: String,
        match: [/\S+@\S+\.\S+/, "Email is invalid"],
        trim: true,
        lowercase: true,
    },

    phone: {
        type: String,
    },

    address: {
        type: String,
    },

    taxNumber: {
        type: String,
    },

    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    }

}, {
    timestamps: true
});

// making the model for the customer schema
const Customer = mongoose.model("Customer", customerSchema);

// exporting the customer model
export default Customer;
