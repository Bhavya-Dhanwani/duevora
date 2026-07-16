// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the ledger entry model
// defining the schema for the ledger entry model
const ledgerEntrySchema = new mongoose.Schema({

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },

    accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account",
        required: [true, "Account reference is required"],
    },

    journalEntryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "JournalEntry",
        required: [true, "Journal entry reference is required"],
    },

    date: {
        type: Date,
        required: [true, "Date is required"],
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

// making the model for the ledger entry schema
const LedgerEntry = mongoose.model("LedgerEntry", ledgerEntrySchema);

// exporting the ledger entry model
export default LedgerEntry;
