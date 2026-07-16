// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the cost center model
// defining the schema for the cost center model
const costCenterSchema = new mongoose.Schema({

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },

    name: {
        type: String,
        required: [true, "Cost center name is required"],
        trim: true,
    },

    code: {
        type: String,
        required: [true, "Cost center code is required"],
        trim: true,
        uppercase: true,
    },

    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    }

}, {
    timestamps: true
});

// adding index for the cost center schema
costCenterSchema.index({ organizationId: 1, code: 1 }, { unique: true });

// making the model for the cost center schema
const CostCenter = mongoose.model("CostCenter", costCenterSchema);

// exporting the cost center model
export default CostCenter;
