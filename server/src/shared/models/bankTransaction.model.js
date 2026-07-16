// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the bank transaction model
// defining the schema for the bank transaction model
const bankTransactionSchema = new mongoose.Schema({

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },

    bankAccountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BankAccount",
        required: [true, "Bank account is required"],
    },

    transactionDate: {
        type: Date,
        required: [true, "Transaction date is required"],
    },

    amount: {
        type: Number,
        required: [true, "Amount is required"],
        min: [0.01, "Amount must be greater than zero"],
    },

    type: {
        type: String,
        enum: ["deposit", "withdrawal"],
        required: [true, "Transaction type is required"],
    },

    reference: {
        type: String,
        trim: true,
    }

}, {
    timestamps: true
});

// making the model for the bank transaction schema
const BankTransaction = mongoose.model("BankTransaction", bankTransactionSchema);

// exporting the bank transaction model
export default BankTransaction;
