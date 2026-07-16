// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the payment model
// defining the schema for the payment model
const paymentSchema = new mongoose.Schema({

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },

    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vendor",
    },

    purchaseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Purchase",
    },

    paymentNumber: {
        type: String,
        required: [true, "Payment number is required"],
        trim: true,
    },

    paymentDate: {
        type: Date,
        required: [true, "Payment date is required"],
    },

    amount: {
        type: Number,
        required: [true, "Payment amount is required"],
        min: [0.01, "Amount must be greater than zero"],
    },

    paymentMethod: {
        type: String,
        required: [true, "Payment method is required"],
        trim: true,
    },

    accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account",
        required: [true, "Account reference is required"],
    }

}, {
    timestamps: true
});

// adding index for the payment schema
paymentSchema.index({ organizationId: 1, paymentNumber: 1 }, { unique: true });

// making the model for the payment schema
const Payment = mongoose.model("Payment", paymentSchema);

// exporting the payment model
export default Payment;
