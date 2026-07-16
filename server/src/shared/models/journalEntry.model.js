// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the journal entry model
// defining the schema for the journal entry model
const journalEntrySchema = new mongoose.Schema({

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },

    entryNumber: {
        type: String,
        required: [true, "Entry number is required"],
        trim: true,
    },

    date: {
        type: Date,
        required: [true, "Date is required"],
    },

    narration: {
        type: String,
        trim: true,
    },

    status: {
        type: String,
        enum: ["draft", "posted"],
        default: "draft",
    }

}, {
    timestamps: true
});

// adding index for the journal entry schema
journalEntrySchema.index({ organizationId: 1, entryNumber: 1 }, { unique: true });

// making the model for the journal entry schema
const JournalEntry = mongoose.model("JournalEntry", journalEntrySchema);

// exporting the journal entry model
export default JournalEntry;
