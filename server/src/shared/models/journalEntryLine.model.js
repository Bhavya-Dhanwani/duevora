// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the journal entry line model
// defining the schema for the journal entry line model
const journalEntryLineSchema = new mongoose.Schema({

    journalEntryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "JournalEntry",
        required: [true, "Journal entry reference is required"],
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

// making the model for the journal entry line schema
const JournalEntryLine = mongoose.model("JournalEntryLine", journalEntryLineSchema);

// exporting the journal entry line model
export default JournalEntryLine;
