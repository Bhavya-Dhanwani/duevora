// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the income model
// defining the schema for the income model
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

// adding index for the income schema
incomeSchema.index({ organizationId: 1, incomeNumber: 1 }, { unique: true });

// making the model for the income schema
const Income = mongoose.model("Income", incomeSchema);

// exporting the income model
export default Income;
