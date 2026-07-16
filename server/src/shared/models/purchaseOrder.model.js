import mongoose from "mongoose";

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

// Unique PO number per organization
purchaseOrderSchema.index({ organizationId: 1, poNumber: 1 }, { unique: true });

const PurchaseOrder = mongoose.model("PurchaseOrder", purchaseOrderSchema);

export default PurchaseOrder;
