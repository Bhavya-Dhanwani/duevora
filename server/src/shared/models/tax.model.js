// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the tax model
// defining the schema for the tax model
const taxSchema = new mongoose.Schema({

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },

    name: {
        type: String,
        required: [true, "Tax name is required"],
        trim: true,
    },

    rate: {
        type: Number,
        required: [true, "Tax rate is required"],
        min: [0, "Tax rate cannot be negative"],
    },

    code: {
        type: String,
        required: [true, "Tax code is required"],
        trim: true,
        uppercase: true,
    }

}, {
    timestamps: true
});

// adding index for the tax schema
taxSchema.index({ organizationId: 1, code: 1 }, { unique: true });

// making the model for the tax schema
const Tax = mongoose.model("Tax", taxSchema);

// exporting the tax model
export default Tax;
