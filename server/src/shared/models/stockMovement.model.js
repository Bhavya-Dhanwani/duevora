// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the stock movement model
// defining the schema for the stock movement model
const stockMovementSchema = new mongoose.Schema({

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },

    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: [true, "Product is required"],
    },

    warehouseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Warehouse",
        required: [true, "Warehouse is required"],
    },

    quantity: {
        type: Number,
        required: [true, "Quantity is required"],
    },

    type: {
        type: String,
        enum: ["in", "out"],
        required: [true, "Type (in/out) is required"],
    },

    referenceType: {
        type: String,
        trim: true,
    },

    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
    },

    date: {
        type: Date,
        default: Date.now,
    }

}, {
    timestamps: true
});

// making the model for the stock movement schema
const StockMovement = mongoose.model("StockMovement", stockMovementSchema);

// exporting the stock movement model
export default StockMovement;
