// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the financial year model
// defining the schema for the financial year model
const financialYearSchema = new mongoose.Schema({

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },

    name: {
        type: String,
        required: [true, "Financial year name is required"],
        trim: true,
    },

    startDate: {
        type: Date,
        required: [true, "Start date is required"],
    },

    endDate: {
        type: Date,
        required: [true, "End date is required"],
    },

    isClosed: {
        type: Boolean,
        default: false,
    }

}, {
    timestamps: true
});

// making the model for the financial year schema
const FinancialYear = mongoose.model("FinancialYear", financialYearSchema);

// exporting the financial year model
export default FinancialYear;
