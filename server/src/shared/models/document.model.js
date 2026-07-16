import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },
    name: {
        type: String,
        required: [true, "Document name is required"],
        trim: true,
    },
    documentType: {
        type: String,
        required: [true, "Document type is required"],
        trim: true,
    },
    fileUrl: {
        type: String,
        required: [true, "File URL is required"],
        trim: true,
    },
    fileSize: {
        type: Number,
    },
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Generator user reference is required"],
    }
}, {
    timestamps: true
});

const Document = mongoose.model("Document", documentSchema);

export default Document;
