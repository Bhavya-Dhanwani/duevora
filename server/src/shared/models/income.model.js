import mongoose from "mongoose";

const incomeSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },
    incomeNumber: {
        type: String,
        required: [true, "Income number is required"],
        trim: true,
    },
    date: {
        type: Date,
        required: [true, "Date is required"],
    },
    amount: {
        type: Number,
        required: [true, "Amount is required"],
        min: [0.01, "Amount must be greater than zero"],
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
    },
    accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account",
        required: [true, "Account reference is required"],
    },
    description: {
        type: String,
        trim: true,
    }
}, {
    timestamps: true
});

// Unique income number per organization
incomeSchema.index({ organizationId: 1, incomeNumber: 1 }, { unique: true });

const Income = mongoose.model("Income", incomeSchema);

export default Income;
