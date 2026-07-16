// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the expense model
// defining the schema for the expense model
const expenseSchema = new mongoose.Schema({

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },

    expenseNumber: {
        type: String,
        required: [true, "Expense number is required"],
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

// adding index for the expense schema
expenseSchema.index({ organizationId: 1, expenseNumber: 1 }, { unique: true });

// making the model for the expense schema
const Expense = mongoose.model("Expense", expenseSchema);

// exporting the expense model
export default Expense;
