// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the budget model
// defining the schema for the budget model
const budgetSchema = new mongoose.Schema({

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

    amount: {
        type: Number,
        required: [true, "Budget amount is required"],
        min: [0, "Budget amount cannot be negative"],
    }

}, {
    timestamps: true
});

// adding index for the budget schema
budgetSchema.index({ financialYearId: 1, accountId: 1 }, { unique: true });

// making the model for the budget schema
const Budget = mongoose.model("Budget", budgetSchema);

// exporting the budget model
export default Budget;
