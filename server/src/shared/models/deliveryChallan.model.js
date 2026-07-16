// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the delivery challan model
// defining the schema for the delivery challan model
const deliveryChallanSchema = new mongoose.Schema({

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },

    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: [true, "Customer is required"],
    },

    challanNumber: {
        type: String,
        required: [true, "Challan number is required"],
        trim: true,
    },

    challanDate: {
        type: Date,
        required: [true, "Challan date is required"],
    },

    status: {
        type: String,
        enum: ["draft", "dispatched", "delivered", "cancelled"],
        default: "draft",
    }

}, {
    timestamps: true
});

// adding index for the delivery challan schema
deliveryChallanSchema.index({ organizationId: 1, challanNumber: 1 }, { unique: true });

// making the model for the delivery challan schema
const DeliveryChallan = mongoose.model("DeliveryChallan", deliveryChallanSchema);

// exporting the delivery challan model
export default DeliveryChallan;
