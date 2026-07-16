// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the category model
// defining the schema for the category model
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

// adding index for the category schema
categorySchema.index({ organizationId: 1, code: 1 }, { unique: true });

// making the model for the category schema
const Category = mongoose.model("Category", categorySchema);

// exporting the category model
export default Category;
