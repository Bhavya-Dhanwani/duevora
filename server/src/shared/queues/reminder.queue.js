import { Queue } from "bullmq";
import env from "../config/env.config.js";
import logger from "../config/logger.config.js";
import { closeRedisConnection, createRedisConnection } from "../config/redis.config.js";
import ServiceUnavailable from "../errors/ServiceUnavailable.error.js";

const REMINDER_JOB_NAME = "send-reminder";
const COMPLETED_JOB_RETENTION = { age: 24 * 60 * 60, count: 500 };
const FAILED_JOB_RETENTION = { age: 7 * 24 * 60 * 60, count: 500 };

let reminderQueue = null;
let reminderQueueConnection = null;

function getReminderJobId(reminderId) {
    const normalizedId = String(reminderId ?? "").trim();

    if (!normalizedId || normalizedId.includes(":")) {
        throw new TypeError("A valid reminder ID is required");
    }

    return `reminder-${normalizedId}`;
}

function getReminderDefaultJobOptions(config = env) {
    return {
        attempts: config.REMINDER_JOB_ATTEMPTS,
        backoff: {
            type: "exponential",
            delay: config.REMINDER_JOB_BACKOFF_MS,
        },
        removeOnComplete: COMPLETED_JOB_RETENTION,
        removeOnFail: FAILED_JOB_RETENTION,
    };
}

function buildReminderQueue({
    QueueClass = Queue,
    config = env,
    connection,
} = {}) {
    if (!config.REMINDER_QUEUE_ENABLED) {
        throw new ServiceUnavailable("Reminder scheduling is currently unavailable.");
    }

    if (!connection) {
        throw new TypeError("A Redis queue connection is required");
    }

    return new QueueClass(config.REMINDER_QUEUE_NAME, {
        connection,
        prefix: config.BULLMQ_PREFIX,
        defaultJobOptions: getReminderDefaultJobOptions(config),
    });
}

function attachReminderQueueEvents(queue, loggerInstance = logger) {
    queue.on("error", (error) => {
        // BullMQ re-emits connection errors. Log only the error class so Redis
        // endpoints and credentials never reach application logs.
        loggerInstance.warn({ errorName: error?.name }, "Reminder queue error");
    });
}

function getReminderQueue() {
    if (!env.REMINDER_QUEUE_ENABLED) {
        throw new ServiceUnavailable("Reminder scheduling is currently unavailable.");
    }

    if (!reminderQueue) {
        // Queue construction is intentionally deferred until a queue-dependent
        // operation runs, keeping Redis outages isolated from unrelated routes.
        reminderQueueConnection = createRedisConnection("reminder-queue", {
            requestBounded: true,
        });
        reminderQueue = buildReminderQueue({ connection: reminderQueueConnection });
        attachReminderQueueEvents(reminderQueue);
    }

    return reminderQueue;
}

async function invalidateReminderQueue(expectedQueue) {
    if (!reminderQueue || (expectedQueue && expectedQueue !== reminderQueue)) {
        return false;
    }

    const connection = reminderQueueConnection;
    reminderQueue = null;
    reminderQueueConnection = null;
    await closeRedisConnection(connection);
    return true;
}

async function closeReminderQueue() {
    const queue = reminderQueue;
    const connection = reminderQueueConnection;
    reminderQueue = null;
    reminderQueueConnection = null;

    try {
        if (queue) await queue.close();
    } finally {
        await closeRedisConnection(connection);
    }
}

export {
    COMPLETED_JOB_RETENTION,
    FAILED_JOB_RETENTION,
    REMINDER_JOB_NAME,
    attachReminderQueueEvents,
    buildReminderQueue,
    closeReminderQueue,
    getReminderDefaultJobOptions,
    getReminderJobId,
    getReminderQueue,
    invalidateReminderQueue,
};
