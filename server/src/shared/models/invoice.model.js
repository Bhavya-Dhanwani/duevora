import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
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
    invoiceNumber: {
        type: String,
        required: [true, "Invoice number is required"],
        trim: true,
    },
    invoiceDate: {
        type: Date,
        required: [true, "Invoice date is required"],
    },
    dueDate: {
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
    discountTotal: {
        type: Number,
        default: 0,
    },
    grandTotal: {
        type: Number,
        required: [true, "Grand total is required"],
        default: 0,
    },
    status: {
        type: String,
        enum: ["draft", "sent", "paid", "partially_paid", "void"],
        default: "draft",
    }
}, {
    timestamps: true
});

// Compound unique index for invoice number within organization
invoiceSchema.index({ organizationId: 1, invoiceNumber: 1 }, { unique: true });

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;
