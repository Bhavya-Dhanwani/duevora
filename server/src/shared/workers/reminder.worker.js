import { UnrecoverableError, Worker } from "bullmq";
import env from "../config/env.config.js";
import logger from "../config/logger.config.js";
import { closeRedisConnection, createRedisConnection } from "../config/redis.config.js";
import Reminder from "../models/reminder.model.js";

const PROCESSING_LOCK_MS = 60 * 1000;
const TERMINAL_REMINDER_STATUSES = new Set(["cancelled", "completed", "sent"]);
const FINAL_EMAIL_STATUSES = new Set(["sent", "skipped"]);
const FINAL_WHATSAPP_STATUSES = new Set(["sent", "skipped", "link_generated"]);

let reminderWorker = null;
let reminderWorkerConnection = null;
let reminderServicePromise = null;

function normalizeJobData(job) {
    const keys = job?.data && typeof job.data === "object"
        ? Object.keys(job.data)
        : [];
    const reminderId = keys.length === 1 && keys[0] === "reminderId"
        ? String(job.data.reminderId ?? "").trim()
        : "";

    if (!reminderId || reminderId.includes(":")) {
        throw new UnrecoverableError("Reminder job data is invalid");
    }

    return reminderId;
}

function isFullyDelivered(reminder) {
    if (!Array.isArray(reminder.channels) || reminder.channels.length === 0) return false;

    return reminder.channels.every((channel) => {
        if (channel === "email") return FINAL_EMAIL_STATUSES.has(reminder.emailStatus);
        if (channel === "whatsapp") return FINAL_WHATSAPP_STATUSES.has(reminder.whatsappStatus);
        return false;
    });
}

function safeAttemptNumber(job) {
    return Number.isInteger(job?.attemptsMade) ? job.attemptsMade + 1 : 1;
}

async function getDefaultReminderService() {
    if (!reminderServicePromise) {
        reminderServicePromise = import("../services/reminder.service.js")
            .then((module) => module.default);
    }

    return await reminderServicePromise;
}

async function markTerminalJob(ReminderModel, reminderId, status) {
    const update = {
        $set: {
            queueStatus: status === "cancelled" ? "removed" : "completed",
            processingLockUntil: null,
            processingBy: null,
        },
    };

    if (["cancelled", "completed", "sent"].includes(status)) {
        update.$unset = { activeDedupeKey: 1 };
    }

    await ReminderModel.updateOne({ _id: reminderId }, update);
}

async function processReminderJob(job, dependencies = {}) {
    const ReminderModel = dependencies.ReminderModel ?? Reminder;
    const loggerInstance = dependencies.loggerInstance ?? logger;
    const now = dependencies.now ?? (() => new Date());
    const lockMs = dependencies.lockMs ?? PROCESSING_LOCK_MS;
    const reminderId = normalizeJobData(job);
    const jobId = String(job.id ?? "");
    const attemptNumber = safeAttemptNumber(job);
    const initialReminder = await ReminderModel.findById(reminderId);

    if (!initialReminder) {
        throw new UnrecoverableError("Reminder was not found");
    }

    if (TERMINAL_REMINDER_STATUSES.has(initialReminder.status) || isFullyDelivered(initialReminder)) {
        await markTerminalJob(ReminderModel, reminderId, initialReminder.status);
        loggerInstance.info({ reminderId, jobId, attemptNumber, status: "skipped" }, "Reminder job skipped");
        return { skipped: true, status: initialReminder.status };
    }

    const lockStartedAt = now();
    const lockOwner = `reminder-worker-${jobId}-${attemptNumber}`.slice(0, 200);
    const lockedReminder = await ReminderModel.findOneAndUpdate({
        _id: reminderId,
        status: { $nin: Array.from(TERMINAL_REMINDER_STATUSES) },
        $or: [
            { processingLockUntil: { $exists: false } },
            { processingLockUntil: null },
            { processingLockUntil: { $lte: lockStartedAt } },
        ],
    }, {
        $set: {
            queueStatus: "processing",
            processingStartedAt: lockStartedAt,
            processingLockUntil: new Date(lockStartedAt.getTime() + lockMs),
            processingBy: lockOwner,
        },
    }, {
        returnDocument: "after",
        runValidators: true,
    });

    if (!lockedReminder) {
        const currentReminder = await ReminderModel.findById(reminderId);

        if (currentReminder && (
            TERMINAL_REMINDER_STATUSES.has(currentReminder.status)
            || isFullyDelivered(currentReminder)
        )) {
            await markTerminalJob(ReminderModel, reminderId, currentReminder.status);
            return { skipped: true, status: currentReminder.status };
        }

        const lockedError = new Error("Reminder is already being processed");
        lockedError.retryable = true;
        throw lockedError;
    }

    loggerInstance.info({ reminderId, jobId, attemptNumber, status: "processing" }, "Reminder job started");

    try {
        // ReminderService performs the authoritative channel-delivery lock. The
        // worker's shorter preflight claim is released immediately before that
        // atomic transition so attempts are not double-counted or deadlocked.
        await ReminderModel.updateOne({ _id: reminderId, processingBy: lockOwner }, {
            $set: {
                processingLockUntil: null,
                processingBy: null,
            },
        });

        const reminderService = dependencies.reminderService ?? await getDefaultReminderService();
        const result = await reminderService.sendReminder({
            reminderId,
            source: "worker",
            jobId,
            attemptNumber,
            processingBy: lockOwner,
        });

        if (result?.processing) {
            const processingError = new Error("Reminder is already being processed");
            processingError.retryable = true;
            throw processingError;
        }

        await ReminderModel.updateOne({
            _id: reminderId,
            status: { $nin: Array.from(TERMINAL_REMINDER_STATUSES) },
            $or: [
                { processingBy: { $exists: false } },
                { processingBy: null },
                { processingBy: lockOwner },
            ],
        }, {
            $set: {
                queueStatus: "completed",
                processingLockUntil: null,
                processingBy: null,
                nextAttemptAt: null,
            },
        });

        loggerInstance.info({ reminderId, jobId, attemptNumber, status: "completed" }, "Reminder job completed");
        return result;
    } catch (error) {
        const permanent = error?.permanent === true;
        const retryDelay = Math.min(
            env.REMINDER_JOB_BACKOFF_MS * (2 ** Math.max(attemptNumber - 1, 0)),
            24 * 60 * 60 * 1000
        );

        await ReminderModel.updateOne({
            _id: reminderId,
            $or: [
                { processingBy: { $exists: false } },
                { processingBy: null },
                { processingBy: lockOwner },
            ],
        }, {
            $set: {
                status: "failed",
                queueStatus: "failed",
                processingLockUntil: null,
                processingBy: null,
                lastError: permanent
                    ? "Reminder delivery cannot be retried."
                    : "Reminder delivery attempt failed.",
                nextAttemptAt: permanent ? null : new Date(now().getTime() + retryDelay),
            },
        });

        loggerInstance.warn({
            reminderId,
            jobId,
            attemptNumber,
            status: permanent ? "permanent_failure" : "retryable_failure",
        }, "Reminder job failed");

        if (permanent) {
            throw new UnrecoverableError("Reminder delivery cannot be retried");
        }

        throw error;
    }
}

function attachWorkerEvents(worker, loggerInstance = logger) {
    worker.on("completed", (job, result) => {
        loggerInstance.info({
            reminderId: job?.data?.reminderId,
            jobId: job?.id,
            attemptNumber: safeAttemptNumber(job),
            status: result?.status ?? (result?.skipped ? "skipped" : "completed"),
        }, "Reminder worker completed a job");
    });

    worker.on("failed", (job, error) => {
        loggerInstance.warn({
            reminderId: job?.data?.reminderId,
            jobId: job?.id,
            attemptNumber: safeAttemptNumber(job),
            status: error instanceof UnrecoverableError ? "permanent_failure" : "failed",
        }, "Reminder worker job failed");
    });

    worker.on("stalled", (jobId) => {
        loggerInstance.warn({ jobId, status: "stalled" }, "Reminder worker job stalled");
    });

    worker.on("error", (error) => {
        loggerInstance.error({ errorName: error?.name }, "Reminder worker error");
    });
}

function buildReminderWorker({
    WorkerClass = Worker,
    config = env,
    connection,
    processor = processReminderJob,
    loggerInstance = logger,
} = {}) {
    if (!connection) {
        throw new TypeError("A Redis worker connection is required");
    }

    const worker = new WorkerClass(config.REMINDER_QUEUE_NAME, processor, {
        connection,
        prefix: config.BULLMQ_PREFIX,
        concurrency: config.REMINDER_WORKER_CONCURRENCY,
    });
    attachWorkerEvents(worker, loggerInstance);
    return worker;
}

async function startReminderWorker() {
    if (env.NODE_ENV === "test" || !env.REMINDER_QUEUE_ENABLED) return null;
    if (reminderWorker) return reminderWorker;

    reminderWorkerConnection = createRedisConnection("reminder-worker");

    try {
        reminderWorker = buildReminderWorker({ connection: reminderWorkerConnection });
        return await waitForReminderWorkerReady(reminderWorker);
    } catch (error) {
        if (reminderWorker || reminderWorkerConnection) {
            await closeReminderWorker(true);
        }
        throw error;
    }
}

async function waitForReminderWorkerReady(worker, cleanup = closeReminderWorker) {
    try {
        await worker.waitUntilReady();
        return worker;
    } catch (error) {
        // A Worker keeps reconnecting after its readiness promise rejects. Close
        // it immediately so a Redis startup outage cannot flood API logs.
        await cleanup(true);
        throw error;
    }
}

async function closeReminderWorker(force = false) {
    const worker = reminderWorker;
    const connection = reminderWorkerConnection;
    reminderWorker = null;
    reminderWorkerConnection = null;

    try {
        if (worker) await worker.close(force);
    } finally {
        await closeRedisConnection(connection);
    }
}

function getReminderWorker() {
    return reminderWorker;
}

export {
    PROCESSING_LOCK_MS,
    attachWorkerEvents,
    buildReminderWorker,
    closeReminderWorker,
    getReminderWorker,
    isFullyDelivered,
    processReminderJob,
    startReminderWorker,
    waitForReminderWorkerReady,
};
