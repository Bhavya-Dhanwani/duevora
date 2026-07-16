import mongoose from "mongoose";

const quotationSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: [true, "Customer is required"],
    },
    quotationNumber: {
        type: String,
        required: [true, "Quotation number is required"],
        trim: true,
    },
    date: {
        type: Date,
        required: [true, "Date is required"],
    },
    expiryDate: {
        type: Date,
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
        enum: ["draft", "sent", "accepted", "rejected", "expired"],
        default: "draft",
    }
}, {
    timestamps: true
});

// Unique quotation number per organization
quotationSchema.index({ organizationId: 1, quotationNumber: 1 }, { unique: true });

const Quotation = mongoose.model("Quotation", quotationSchema);

export default Quotation;
