// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the unit model
// defining the schema for the unit model
const unitSchema = new mongoose.Schema({

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },

    name: {
        type: String,
        required: [true, "Unit name is required"],
        trim: true,
    },

    code: {
        type: String,
        required: [true, "Unit code is required"],
        trim: true,
        uppercase: true,
    }

}, {
    timestamps: true
});

// adding index for the unit schema
unitSchema.index({ organizationId: 1, code: 1 }, { unique: true });

// making the model for the unit schema
const Unit = mongoose.model("Unit", unitSchema);

// exporting the unit model
export default Unit;
