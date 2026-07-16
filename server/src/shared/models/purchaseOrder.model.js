// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the purchase order model
// defining the schema for the purchase order model
const purchaseOrderSchema = new mongoose.Schema({

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

    poNumber: {
        type: String,
        required: [true, "PO number is required"],
        trim: true,
    },

    poDate: {
        type: Date,
        required: [true, "PO date is required"],
    },

    grandTotal: {
        type: Number,
        required: [true, "Grand total is required"],
        default: 0,
    },

    status: {
        type: String,
        enum: ["draft", "sent", "ordered", "received", "cancelled"],
        default: "draft",
    }

}, {
    timestamps: true
});

// adding index for the purchase order schema
purchaseOrderSchema.index({ organizationId: 1, poNumber: 1 }, { unique: true });

// making the model for the purchase order schema
const PurchaseOrder = mongoose.model("PurchaseOrder", purchaseOrderSchema);

// exporting the purchase order model
export default PurchaseOrder;
