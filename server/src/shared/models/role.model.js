import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },
    name: {
        type: String,
        required: [true, "Role name is required"],
    },
    code: {
        type: String,
        required: [true, "Role code is required"],
        trim: true,
        uppercase: true,
    },
    description: {
        type: String,
    }
}, {
    timestamps: true
});

// Compound unique index for code per organization
roleSchema.index({ organizationId: 1, code: 1 }, { unique: true });

const Role = mongoose.model("Role", roleSchema);

export default Role;
