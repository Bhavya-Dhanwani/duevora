import mongoose from "mongoose";

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

// Unique code per organization
warehouseSchema.index({ organizationId: 1, code: 1 }, { unique: true });

const Warehouse = mongoose.model("Warehouse", warehouseSchema);

export default Warehouse;
