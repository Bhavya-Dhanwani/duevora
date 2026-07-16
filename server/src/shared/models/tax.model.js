import mongoose from "mongoose";

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

// Compound unique index for code per organization
taxSchema.index({ organizationId: 1, code: 1 }, { unique: true });

const Tax = mongoose.model("Tax", taxSchema);

export default Tax;
