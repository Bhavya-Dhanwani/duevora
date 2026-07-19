import mongoose from "mongoose";

const ERROR_CODE_MAX_LENGTH = 100;
const ERROR_MESSAGE_MAX_LENGTH = 500;

function sanitizeText(value, maxLength) {
    if (typeof value !== "string") {
        return value;
    }

    return value
        .replace(/[\u0000-\u001F\u007F]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, maxLength);
}

const reminderDeliverySchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },

    reminderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Reminder",
        required: [true, "Reminder is required"],
    },

    channel: {
        type: String,
        enum: ["email", "whatsapp"],
        required: [true, "Delivery channel is required"],
    },

    attemptNumber: {
        type: Number,
        required: [true, "Delivery attempt number is required"],
        min: [1, "Delivery attempt number must be positive"],
        validate: {
            validator: Number.isInteger,
            message: "Delivery attempt number must be an integer",
        },
    },

    status: {
        type: String,
        enum: ["processing", "sent", "failed", "link_generated", "skipped"],
        default: "processing",
        required: true,
    },

    provider: {
        type: String,
        enum: ["smtp", "mock_smtp", "whatsapp_cloud", "whatsapp_deeplink"],
        required: [true, "Delivery provider is required"],
    },

    providerMessageId: {
        type: String,
        trim: true,
    },

    destinationMasked: {
        type: String,
        required: [true, "Masked delivery destination is required"],
        trim: true,
        maxlength: [320, "Masked delivery destination is too long"],
    },

    startedAt: {
        type: Date,
        default: Date.now,
        required: true,
    },

    completedAt: {
        type: Date,
    },

    errorCode: {
        type: String,
        trim: true,
        maxlength: [ERROR_CODE_MAX_LENGTH, "Delivery error code is too long"],
        set: (value) => sanitizeText(value, ERROR_CODE_MAX_LENGTH),
    },

    errorMessage: {
        type: String,
        trim: true,
        maxlength: [ERROR_MESSAGE_MAX_LENGTH, "Delivery error message is too long"],
        set: (value) => sanitizeText(value, ERROR_MESSAGE_MAX_LENGTH),
    },
}, {
    timestamps: true,
});

// A delivery attempt can be retried by BullMQ, so this key prevents duplicate
// audit rows when the same attempt is processed more than once.
reminderDeliverySchema.index(
    { reminderId: 1, channel: 1, attemptNumber: 1 },
    { unique: true }
);

const ReminderDelivery = mongoose.model("ReminderDelivery", reminderDeliverySchema);

export default ReminderDelivery;
