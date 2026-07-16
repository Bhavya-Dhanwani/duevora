import mongoose from "mongoose";

const stockAdjustmentSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },
    warehouseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Warehouse",
        required: [true, "Warehouse is required"],
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: [true, "Product is required"],
    },
    adjustedQuantity: {
        type: Number,
        required: [true, "Adjusted quantity is required"],
    },
    reason: {
        type: String,
        trim: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    adjustedById: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        required: [true, "Adjusted by employee reference is required"],
    }
}, {
    timestamps: true
});

const StockAdjustment = mongoose.model("StockAdjustment", stockAdjustmentSchema);

export default StockAdjustment;
