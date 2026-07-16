// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the bank account model
// defining the schema for the bank account model
const bankAccountSchema = new mongoose.Schema({

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },

    bankName: {
        type: String,
        required: [true, "Bank name is required"],
        trim: true,
    },

    accountNumber: {
        type: String,
        required: [true, "Account number is required"],
        trim: true,
    },

    ifscCode: {
        type: String,
        trim: true,
    },

    branch: {
        type: String,
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

// adding index for the bank account schema
bankAccountSchema.index({ organizationId: 1, accountNumber: 1 }, { unique: true });

// making the model for the bank account schema
const BankAccount = mongoose.model("BankAccount", bankAccountSchema);

// exporting the bank account model
export default BankAccount;
