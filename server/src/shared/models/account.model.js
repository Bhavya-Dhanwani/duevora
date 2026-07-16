import mongoose from "mongoose";

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

// Unique account code within the organization
accountSchema.index({ organizationId: 1, code: 1 }, { unique: true });

const Account = mongoose.model("Account", accountSchema);

export default Account;
