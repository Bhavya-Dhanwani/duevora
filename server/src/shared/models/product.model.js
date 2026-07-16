// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the product model
// defining the schema for the product model
const productSchema = new mongoose.Schema({

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },

    name: {
        type: String,
        required: [true, "Product name is required"],
        trim: true,
    },

    sku: {
        type: String,
        required: [true, "SKU is required"],
        trim: true,
    },

    description: {
        type: String,
    },

    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
    },

    unitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Unit",
    },

    price: {
        type: Number,
        default: 0,
    },

    cost: {
        type: Number,
        default: 0,
    },

    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    }

}, {
    timestamps: true
});

// adding index for the product schema
productSchema.index({ organizationId: 1, sku: 1 }, { unique: true });

// making the model for the product schema
const Product = mongoose.model("Product", productSchema);

// exporting the product model
export default Product;
