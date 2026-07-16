// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the account model
// defining the schema for the account model
const accountSchema = new mongoose.Schema({

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },

    name: {
        type: String,
        required: [true, "Account name is required"],
        trim: true,
    },

    code: {
        type: String,
        required: [true, "Account code is required"],
        trim: true,
    },

    type: {
        type: String,
        enum: ["asset", "liability", "equity", "revenue", "expense"],
        required: [true, "Account type is required"],
    },

    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    }

}, {
    timestamps: true
});

// adding index for the account schema
accountSchema.index({ organizationId: 1, code: 1 }, { unique: true });

// making the model for the account schema
const Account = mongoose.model("Account", accountSchema);

// exporting the account model
export default Account;
