// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the warehouse model
// defining the schema for the warehouse model
const warehouseSchema = new mongoose.Schema({

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },

    name: {
        type: String,
        required: [true, "Warehouse name is required"],
        trim: true,
    },

    code: {
        type: String,
        required: [true, "Warehouse code is required"],
        trim: true,
        uppercase: true,
    },

    address: {
        type: String,
    },

    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    }

}, {
    timestamps: true
});

// adding index for the warehouse schema
warehouseSchema.index({ organizationId: 1, code: 1 }, { unique: true });

// making the model for the warehouse schema
const Warehouse = mongoose.model("Warehouse", warehouseSchema);

// exporting the warehouse model
export default Warehouse;
