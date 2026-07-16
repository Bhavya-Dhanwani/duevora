import mongoose from "mongoose";

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

// Unique payment number per organization
paymentSchema.index({ organizationId: 1, paymentNumber: 1 }, { unique: true });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
