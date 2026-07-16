// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the inventory model
// defining the schema for the inventory model
const inventorySchema = new mongoose.Schema({

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
        default: 0,
    }

}, {
    timestamps: true
});

// adding index for the inventory schema
inventorySchema.index({ productId: 1, warehouseId: 1 }, { unique: true });

// making the model for the inventory schema
const Inventory = mongoose.model("Inventory", inventorySchema);

// exporting the inventory model
export default Inventory;
