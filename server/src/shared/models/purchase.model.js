// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the purchase model
// defining the schema for the purchase model
const purchaseSchema = new mongoose.Schema({

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },

    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vendor",
        required: [true, "Vendor is required"],
    },

    purchaseNumber: {
        type: String,
        required: [true, "Purchase number is required"],
        trim: true,
    },

    purchaseDate: {
        type: Date,
        required: [true, "Purchase date is required"],
    },

    subTotal: {
        type: Number,
        required: [true, "Subtotal is required"],
        default: 0,
    },

    taxTotal: {
        type: Number,
        required: [true, "Tax total is required"],
        default: 0,
    },

    grandTotal: {
        type: Number,
        required: [true, "Grand total is required"],
        default: 0,
    },

    status: {
        type: String,
        enum: ["billed", "received", "paid", "partially_paid"],
        default: "billed",
    }

}, {
    timestamps: true
});

// adding index for the purchase schema
purchaseSchema.index({ organizationId: 1, purchaseNumber: 1 }, { unique: true });

// making the model for the purchase schema
const Purchase = mongoose.model("Purchase", purchaseSchema);

// exporting the purchase model
export default Purchase;
