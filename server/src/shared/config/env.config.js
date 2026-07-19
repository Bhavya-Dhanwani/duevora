// Importing modules
import { config } from "dotenv";
import z from "zod";
import envConstants from "../constants/env.constants.js";

// loading environment variables
config({ quiet: true });

const booleanValue = z.preprocess((value) => {
    if (typeof value !== "string") return value;

    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;

    return value;
}, z.boolean());

const positiveInteger = z.coerce.number().int().positive();
const hasNonBlankValue = (value) => typeof value === "string" && value.trim().length > 0;

const redisUrl = z.string().url().refine((value) => {
    try {
        const protocol = new URL(value).protocol;
        return protocol === "redis:" || protocol === "rediss:";
    } catch {
        return false;
    }
}, "Redis URL must use redis:// or rediss://");

// defining the schema for environment variables
const envSchema = z.object({
    PORT: positiveInteger.default(envConstants.PORT),
    NODE_ENV: z.enum(["development", "production", "test"]).default(envConstants.NODE_ENV),
    MONGO_URI: z.string().min(1).default(envConstants.MONGO_URI),
    ACCESS_TOKEN_SECRET: z.string().min(1).default(envConstants.ACCESS_TOKEN_SECRET),
    REFRESH_TOKEN_SECRET: z.string().min(1).default(envConstants.REFRESH_TOKEN_SECRET),
    FRONTEND_URL: z.string().url().default(envConstants.FRONTEND_URL),
    SMTP_HOST: z.string().default(envConstants.SMTP_HOST),
    SMTP_PORT: positiveInteger.default(envConstants.SMTP_PORT),
    SMTP_USER: z.string().default(envConstants.SMTP_USER),
    SMTP_PASS: z.string().default(envConstants.SMTP_PASS),
    SENDING_USER: z.string().default(envConstants.SENDING_USER),
    GOOGLE_CLIENT_ID: z.string().default(envConstants.GOOGLE_CLIENT_ID),
    GOOGLE_CLIENT_SECRET: z.string().default(envConstants.GOOGLE_CLIENT_SECRET),
    GOOGLE_REDIRECT_URI: z.string().url().default(envConstants.GOOGLE_REDIRECT_URI),
    SEND_MAIL: booleanValue.default(envConstants.SEND_MAIL),
    RAZORPAY_ENABLED: booleanValue.default(envConstants.RAZORPAY_ENABLED),
    RAZORPAY_KEY_ID: z.string().default(envConstants.RAZORPAY_KEY_ID),
    RAZORPAY_KEY_SECRET: z.string().default(envConstants.RAZORPAY_KEY_SECRET),
    RAZORPAY_WEBHOOK_SECRET: z.string().default(envConstants.RAZORPAY_WEBHOOK_SECRET),
    RAZORPAY_API_BASE_URL: z.string().url().default(envConstants.RAZORPAY_API_BASE_URL),
    APP_BASE_URL: z.string().url().default(envConstants.APP_BASE_URL),
    REDIS_URL: redisUrl.default(envConstants.REDIS_URL),
    BULLMQ_PREFIX: z.string().min(1).default(envConstants.BULLMQ_PREFIX),
    REMINDER_QUEUE_NAME: z.string().min(1).default(envConstants.REMINDER_QUEUE_NAME),
    REMINDER_QUEUE_ENABLED: booleanValue.default(envConstants.REMINDER_QUEUE_ENABLED),
    REMINDER_WORKER_IN_PROCESS: booleanValue.default(envConstants.REMINDER_WORKER_IN_PROCESS),
    REMINDER_WORKER_CONCURRENCY: positiveInteger.default(envConstants.REMINDER_WORKER_CONCURRENCY),
    REMINDER_JOB_ATTEMPTS: positiveInteger.default(envConstants.REMINDER_JOB_ATTEMPTS),
    REMINDER_JOB_BACKOFF_MS: positiveInteger.default(envConstants.REMINDER_JOB_BACKOFF_MS),
    REMINDER_RECOVERY_INTERVAL_MS: positiveInteger.default(envConstants.REMINDER_RECOVERY_INTERVAL_MS),
    REMINDER_RECOVERY_BATCH_SIZE: positiveInteger.default(envConstants.REMINDER_RECOVERY_BATCH_SIZE),
    WHATSAPP_MODE: z.enum(["disabled", "deeplink", "cloud"]).default(envConstants.WHATSAPP_MODE),
    WHATSAPP_DEFAULT_COUNTRY_CODE: z.string().regex(/^\d{1,3}$/).default(envConstants.WHATSAPP_DEFAULT_COUNTRY_CODE),
    WHATSAPP_API_VERSION: z.string().default(envConstants.WHATSAPP_API_VERSION),
    WHATSAPP_PHONE_NUMBER_ID: z.string().default(envConstants.WHATSAPP_PHONE_NUMBER_ID),
    WHATSAPP_ACCESS_TOKEN: z.string().default(envConstants.WHATSAPP_ACCESS_TOKEN),
    WHATSAPP_TEMPLATE_NAME: z.string().default(envConstants.WHATSAPP_TEMPLATE_NAME),
    WHATSAPP_TEMPLATE_LANGUAGE: z.string().trim().min(1).default(envConstants.WHATSAPP_TEMPLATE_LANGUAGE),
}).superRefine((values, context) => {
    if (values.NODE_ENV === "production") {
        for (const key of ["ACCESS_TOKEN_SECRET", "REFRESH_TOKEN_SECRET"]) {
            if (values[key] === envConstants[key]) {
                context.addIssue({
                    code: "custom",
                    path: [key],
                    message: `${key} must be configured for production`,
                });
            }
        }
    }

    if (values.SEND_MAIL && (
        !hasNonBlankValue(values.SMTP_USER)
        || !hasNonBlankValue(values.SMTP_PASS)
        || values.SMTP_PASS === envConstants.SMTP_PASS
    )) {
        context.addIssue({
            code: "custom",
            path: ["SMTP_PASS"],
            message: "SMTP credentials are required when mail delivery is enabled",
        });
    }

    if (values.RAZORPAY_ENABLED) {
        for (const key of ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"]) {
            if (!hasNonBlankValue(values[key])) {
                context.addIssue({
                    code: "custom",
                    path: [key],
                    message: `${key} is required when Razorpay is enabled`,
                });
            }
        }
    }

    if (values.WHATSAPP_MODE === "cloud") {
        const requiredCloudKeys = [
            "WHATSAPP_API_VERSION",
            "WHATSAPP_PHONE_NUMBER_ID",
            "WHATSAPP_ACCESS_TOKEN",
            "WHATSAPP_TEMPLATE_NAME",
        ];

        for (const key of requiredCloudKeys) {
            if (!hasNonBlankValue(values[key])) {
                context.addIssue({
                    code: "custom",
                    path: [key],
                    message: `${key} is required in WhatsApp Cloud mode`,
                });
            }
        }
    }
});

// parsing and validating environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    const safeIssues = parsedEnv.error.issues.map(({ path, message }) => ({
        field: path.join("."),
        message,
    }));

    console.error("Invalid environment configuration:", safeIssues);
    process.exit(1);
}

// getting the validated environment variables
const env = parsedEnv.data;

export default env;
