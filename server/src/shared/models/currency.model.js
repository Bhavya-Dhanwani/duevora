// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the currency model
// defining the schema for the currency model
const currencySchema = new mongoose.Schema({

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },

    name: {
        type: String,
        required: [true, "Currency name is required"],
        trim: true,
    },

    code: {
        type: String,
        required: [true, "Currency code is required"],
        trim: true,
        uppercase: true,
    },

    symbol: {
        type: String,
        required: [true, "Currency symbol is required"],
        trim: true,
    },

    isBase: {
        type: Boolean,
        default: false,
    }

}, {
    timestamps: true
});

// adding index for the currency schema
currencySchema.index({ organizationId: 1, code: 1 }, { unique: true });

// making the model for the currency schema
const Currency = mongoose.model("Currency", currencySchema);

// exporting the currency model
export default Currency;
