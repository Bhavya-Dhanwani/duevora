import mongoose from "mongoose";
import env from "../config/env.config.js";

const LAST_ERROR_MAX_LENGTH = 500;

function sanitizeLastError(value) {
    if (typeof value !== "string") {
        return value;
    }

    return value
        .replace(/[\u0000-\u001F\u007F]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, LAST_ERROR_MAX_LENGTH);
}

function hasUniqueChannels(channels) {
    return Array.isArray(channels) && new Set(channels).size === channels.length;
}

const reminderSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "Organization is required"],
    },

    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: [true, "Customer is required"],
    },

    invoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Invoice",
        required: [true, "Invoice is required"],
    },

    paymentLinkId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PaymentLink",
        required: [true, "Payment link is required"],
    },

    title: {
        type: String,
        required: [true, "Reminder title is required"],
        trim: true,
    },

    description: {
        type: String,
        trim: true,
    },

    scheduledFor: {
        type: Date,
        required: [true, "Reminder schedule is required"],
    },

    channels: {
        type: [{
            type: String,
            enum: ["email", "whatsapp"],
        }],
        required: [true, "At least one reminder channel is required"],
        validate: [
            {
                validator: (channels) => Array.isArray(channels) && channels.length > 0,
                message: "At least one reminder channel is required",
            },
            {
                validator: hasUniqueChannels,
                message: "Reminder channels must be unique",
            },
        ],
    },

    status: {
        type: String,
        enum: [
            "scheduled",
            "queued",
            "processing",
            "sent",
            "partially_sent",
            "action_required",
            "failed",
            "completed",
            "cancelled",
        ],
        default: "scheduled",
        required: true,
    },

    emailStatus: {
        type: String,
        enum: ["pending", "sent", "failed", "skipped"],
        default: "pending",
        required: true,
    },

    whatsappStatus: {
        type: String,
        enum: ["pending", "sent", "failed", "link_generated", "skipped"],
        default: "pending",
        required: true,
    },

    emailProviderMessageId: {
        type: String,
        trim: true,
    },

    whatsappProviderMessageId: {
        type: String,
        trim: true,
    },

    whatsappDeepLink: {
        type: String,
        trim: true,
    },

    attempts: {
        type: Number,
        default: 0,
        min: [0, "Reminder attempts cannot be negative"],
        validate: {
            validator: Number.isInteger,
            message: "Reminder attempts must be an integer",
        },
    },

    maxAttempts: {
        type: Number,
        default: env.REMINDER_JOB_ATTEMPTS,
        min: [1, "Maximum reminder attempts must be positive"],
        validate: {
            validator: Number.isInteger,
            message: "Maximum reminder attempts must be an integer",
        },
    },

    nextAttemptAt: {
        type: Date,
    },

    lastAttemptAt: {
        type: Date,
    },

    sentAt: {
        type: Date,
    },

    completedAt: {
        type: Date,
    },

    cancelledAt: {
        type: Date,
    },

    processingStartedAt: {
        type: Date,
    },

    processingLockUntil: {
        type: Date,
    },

    processingBy: {
        type: String,
        trim: true,
    },

    queueStatus: {
        type: String,
        enum: ["pending", "queued", "processing", "completed", "failed", "removed"],
        default: "pending",
        required: true,
    },

    queueJobId: {
        type: String,
        trim: true,
    },

    queuedAt: {
        type: Date,
    },

    lastError: {
        type: String,
        trim: true,
        maxlength: [LAST_ERROR_MAX_LENGTH, "Reminder error message is too long"],
        set: sanitizeLastError,
    },

    // This internal fingerprint is present only while a reminder is active,
    // allowing MongoDB to reject concurrent duplicate scheduling requests.
    activeDedupeKey: {
        type: String,
        trim: true,
        maxlength: 64,
        select: false,
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
}, {
    timestamps: true,
});

reminderSchema.index({ organizationId: 1, scheduledFor: 1, status: 1 });
reminderSchema.index({ organizationId: 1, invoiceId: 1 });
reminderSchema.index({ organizationId: 1, customerId: 1 });
reminderSchema.index({ paymentLinkId: 1 });
reminderSchema.index({ queueStatus: 1, scheduledFor: 1 });
reminderSchema.index({ status: 1, nextAttemptAt: 1, processingLockUntil: 1 });
reminderSchema.index(
    { organizationId: 1, activeDedupeKey: 1 },
    {
        unique: true,
        partialFilterExpression: { activeDedupeKey: { $type: "string" } },
    }
);

const Reminder = mongoose.model("Reminder", reminderSchema);

export default Reminder;
