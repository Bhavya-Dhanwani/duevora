import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },
    name: {
        type: String,
        required: [true, "Category name is required"],
        trim: true,
    },
    code: {
        type: String,
        required: [true, "Category code is required"],
        trim: true,
        uppercase: true,
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
    }
}, {
    timestamps: true
});

// Compound unique index for code per organization
categorySchema.index({ organizationId: 1, code: 1 }, { unique: true });

const Category = mongoose.model("Category", categorySchema);

export default Category;
