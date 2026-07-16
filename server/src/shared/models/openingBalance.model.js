// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the opening balance model
// defining the schema for the opening balance model
const openingBalanceSchema = new mongoose.Schema({

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },

    financialYearId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FinancialYear",
        required: [true, "Financial year reference is required"],
    },

    accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account",
        required: [true, "Account reference is required"],
    },

    debit: {
        type: Number,
        default: 0,
    },

    credit: {
        type: Number,
        default: 0,
    }

}, {
    timestamps: true
});

// adding index for the opening balance schema
openingBalanceSchema.index({ financialYearId: 1, accountId: 1 }, { unique: true });

// making the model for the opening balance schema
const OpeningBalance = mongoose.model("OpeningBalance", openingBalanceSchema);

// exporting the opening balance model
export default OpeningBalance;
