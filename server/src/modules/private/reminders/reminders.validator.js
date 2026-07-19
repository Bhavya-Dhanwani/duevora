import mongoose from "mongoose";
import { body, param, query } from "express-validator";
import validateErrors from "../../../shared/utils/validateErrors.util.js";

const REMINDER_STATUSES = [
    "scheduled",
    "queued",
    "processing",
    "sent",
    "partially_sent",
    "action_required",
    "failed",
    "completed",
    "cancelled",
];
const CHANNELS = ["email", "whatsapp"];

const objectId = (value) => mongoose.Types.ObjectId.isValid(value);

const createReminderValidators = [
    body("invoiceId")
        .notEmpty()
        .withMessage("Invoice ID is required")
        .custom(objectId)
        .withMessage("Invalid Invoice ID"),
    body("scheduledFor")
        .notEmpty()
        .withMessage("Scheduled time is required")
        .isISO8601({ strict: true })
        .withMessage("Scheduled time must be a valid ISO 8601 date"),
    body("channels")
        .isArray({ min: 1 })
        .withMessage("At least one reminder channel is required")
        .custom((channels) => channels.every((channel) => CHANNELS.includes(channel)))
        .withMessage("Reminder channels must be email or whatsapp")
        .custom((channels) => new Set(channels).size === channels.length)
        .withMessage("Reminder channels must be unique"),
    body("title")
        .optional()
        .trim()
        .isString()
        .isLength({ min: 1, max: 200 })
        .withMessage("Title must contain 1 to 200 characters"),
    body("description")
        .optional()
        .trim()
        .isString()
        .isLength({ max: 2000 })
        .withMessage("Description must contain at most 2000 characters"),
    body("customerId")
        .not()
        .exists()
        .withMessage("Customer ID is derived from the invoice"),
    body("paymentId")
        .not()
        .exists()
        .withMessage("Outgoing payment references are not valid for invoice reminders"),
    body("status")
        .not()
        .exists()
        .withMessage("Reminder status is managed by the server"),
    validateErrors,
];

const reminderIdValidators = [
    param("reminderId")
        .custom(objectId)
        .withMessage("Invalid Reminder ID"),
    validateErrors,
];

const sendReminderValidators = [
    param("reminderId")
        .custom(objectId)
        .withMessage("Invalid Reminder ID"),
    query("wait")
        .optional()
        .isBoolean()
        .withMessage("wait must be true or false")
        .toBoolean(),
    validateErrors,
];

const listReminderValidators = [
    query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer").toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100").toInt(),
    query("status").optional().isIn(REMINDER_STATUSES).withMessage("Invalid reminder status"),
    query("invoiceId").optional().custom(objectId).withMessage("Invalid Invoice ID"),
    query("customerId").optional().custom(objectId).withMessage("Invalid Customer ID"),
    query("channel").optional().isIn(CHANNELS).withMessage("Invalid reminder channel"),
    query("scheduledFrom").optional().isISO8601({ strict: true }).withMessage("Invalid scheduledFrom date"),
    query("scheduledTo").optional().isISO8601({ strict: true }).withMessage("Invalid scheduledTo date"),
    query("sortBy")
        .optional()
        .isIn(["scheduledFor", "createdAt", "status"])
        .withMessage("Invalid sort field"),
    query("sortOrder").optional().isIn(["asc", "desc"]).withMessage("sortOrder must be asc or desc"),
    validateErrors,
];

export {
    createReminderValidators,
    listReminderValidators,
    reminderIdValidators,
    sendReminderValidators,
};
