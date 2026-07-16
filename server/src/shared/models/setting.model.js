// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the setting model
// defining the schema for the setting model
const settingSchema = new mongoose.Schema({

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },

    key: {
        type: String,
        required: [true, "Key is required"],
        trim: true,
    },

    value: {
        type: String,
        required: [true, "Value is required"],
        trim: true,
    }

}, {
    timestamps: true
});

// adding index for the setting schema
settingSchema.index({ organizationId: 1, key: 1 }, { unique: true });

// making the model for the setting schema
const Setting = mongoose.model("Setting", settingSchema);

// exporting the setting model
export default Setting;
