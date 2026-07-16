// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the invoice model
// defining the schema for the invoice model
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

// adding index for the invoice schema
invoiceSchema.index({ organizationId: 1, invoiceNumber: 1 }, { unique: true });

// making the model for the invoice schema
const Invoice = mongoose.model("Invoice", invoiceSchema);

// exporting the invoice model
export default Invoice;
