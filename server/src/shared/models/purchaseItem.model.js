// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the purchase item model
// defining the schema for the purchase item model
const purchaseItemSchema = new mongoose.Schema({

    purchaseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Purchase",
        required: [true, "Purchase reference is required"],
    },

    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: [true, "Product is required"],
    },

    quantity: {
        type: Number,
        required: [true, "Quantity is required"],
        min: [1, "Quantity must be at least 1"],
    },

    unitPrice: {
        type: Number,
        required: [true, "Unit price is required"],
        min: [0, "Unit price cannot be negative"],
    },

    taxId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tax",
    },

    taxAmount: {
        type: Number,
        default: 0,
    },

    total: {
        type: Number,
        required: [true, "Total is required"],
        default: 0,
    }

}, {
    timestamps: true
});

// making the model for the purchase item schema
const PurchaseItem = mongoose.model("PurchaseItem", purchaseItemSchema);

// exporting the purchase item model
export default PurchaseItem;
