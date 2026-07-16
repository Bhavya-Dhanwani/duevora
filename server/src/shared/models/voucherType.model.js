// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the voucher type model
// defining the schema for the voucher type model
const voucherTypeSchema = new mongoose.Schema({

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },

    name: {
        type: String,
        required: [true, "Voucher type name is required"],
        trim: true,
    },

    code: {
        type: String,
        required: [true, "Voucher type code is required"],
        trim: true,
        uppercase: true,
    }

}, {
    timestamps: true
});

// adding index for the voucher type schema
voucherTypeSchema.index({ organizationId: 1, code: 1 }, { unique: true });

// making the model for the voucher type schema
const VoucherType = mongoose.model("VoucherType", voucherTypeSchema);

// exporting the voucher type model
export default VoucherType;
