// Importing module
import mongoose from "mongoose";

// Importing module

// defining the schema for the attachment model
// defining the schema for the attachment model
const attachmentSchema = new mongoose.Schema({

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },

    filename: {
        type: String,
        required: [true, "Filename is required"],
        trim: true,
    },

    fileUrl: {
        type: String,
        required: [true, "File URL is required"],
        trim: true,
    },

    fileType: {
        type: String,
        trim: true,
    },

    fileSize: {
        type: Number,
    },

    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Uploader user reference is required"],
    }

}, {
    timestamps: true
});

// making the model for the attachment schema
const Attachment = mongoose.model("Attachment", attachmentSchema);

// exporting the attachment model
export default Attachment;
