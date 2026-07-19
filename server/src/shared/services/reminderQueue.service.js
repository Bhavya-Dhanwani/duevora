import env from "../config/env.config.js";
import logger from "../config/logger.config.js";
import ServiceUnavailable from "../errors/ServiceUnavailable.error.js";
import Reminder from "../models/reminder.model.js";
import {
    REMINDER_JOB_NAME,
    getReminderJobId,
    getReminderQueue,
    invalidateReminderQueue,
} from "../queues/reminder.queue.js";

const QUEUE_UNAVAILABLE_MESSAGE = "Reminder scheduling is temporarily unavailable.";
const DEFAULT_QUEUE_OPERATION_TIMEOUT_MS = 5000;
const REPLACEABLE_JOB_STATES = new Set(["completed", "delayed", "failed"]);

function normalizeReminderId(reminderId) {
    const normalizedId = String(reminderId ?? "").trim();
    getReminderJobId(normalizedId);
    return normalizedId;
}

function resolveScheduledTime(scheduledFor) {
    const scheduledDate = scheduledFor instanceof Date
        ? scheduledFor
        : new Date(scheduledFor);

    if (Number.isNaN(scheduledDate.getTime())) {
        throw new TypeError("A valid reminder schedule is required");
    }

    return scheduledDate;
}

function queueStatusForJobState(state) {
    if (state === "completed") return "completed";
    if (state === "failed") return "failed";
    if (state === "active") return "processing";
    return "queued";
}

async function withQueueOperationTimeout(operation, timeoutMs) {
    let timeout;

    const timeoutPromise = new Promise((_, reject) => {
        timeout = setTimeout(() => {
            reject(new ServiceUnavailable(QUEUE_UNAVAILABLE_MESSAGE));
        }, timeoutMs);
        timeout.unref?.();
    });

    try {
        return await Promise.race([
            Promise.resolve().then(operation),
            timeoutPromise,
        ]);
    } finally {
        clearTimeout(timeout);
    }
}

class ReminderQueueService {
    constructor({
        config = env,
        loggerInstance = logger,
        queueProvider = getReminderQueue,
        queueInvalidator = invalidateReminderQueue,
        ReminderModel = Reminder,
        now = () => new Date(),
        operationTimeoutMs = DEFAULT_QUEUE_OPERATION_TIMEOUT_MS,
    } = {}) {
        this.config = config;
        this.logger = loggerInstance;
        this.queueProvider = queueProvider;
        this.queueInvalidator = queueInvalidator;
        this.ReminderModel = ReminderModel;
        this.now = now;
        this.operationTimeoutMs = operationTimeoutMs;
    }

    runQueueOperation = async (operation) => {
        return await withQueueOperationTimeout(operation, this.operationTimeoutMs);
    };

    invalidateFailedQueue = async (queue) => {
        if (!queue) return;

        try {
            await this.queueInvalidator(queue);
        } catch {
            this.logger.warn({}, "Unable to reset reminder queue connection");
        }
    };

    enqueueReminder = async ({ reminderId, scheduledFor, replaceExisting = false }) => {
        const normalizedId = normalizeReminderId(reminderId);
        const scheduledDate = resolveScheduledTime(scheduledFor);
        const jobId = getReminderJobId(normalizedId);

        if (!this.config.REMINDER_QUEUE_ENABLED) {
            await this.markQueueFailure(normalizedId);
            throw new ServiceUnavailable("Reminder scheduling is currently unavailable.");
        }

        let queue;

        try {
            const { job, reused, state } = await this.runQueueOperation(async () => {
                queue = await this.queueProvider();
                let queuedJob = await queue.getJob(jobId);
                let reusedJob = Boolean(queuedJob);
                let jobState = queuedJob ? await queuedJob.getState() : null;

                if (queuedJob && replaceExisting && REPLACEABLE_JOB_STATES.has(jobState)) {
                    await queuedJob.remove();
                    queuedJob = null;
                    jobState = null;
                    reusedJob = false;
                }

                if (!queuedJob) {
                    const delay = Math.max(0, scheduledDate.getTime() - this.now().getTime());
                    queuedJob = await queue.add(
                        REMINDER_JOB_NAME,
                        { reminderId: normalizedId },
                        { jobId, delay }
                    );
                    jobState = delay > 0 ? "delayed" : "waiting";
                }

                return { job: queuedJob, reused: reusedJob, state: jobState };
            });

            const queueStatus = queueStatusForJobState(state);
            await this.ReminderModel.updateOne({ _id: normalizedId }, {
                $set: {
                    queueJobId: String(job.id ?? jobId),
                    queueStatus,
                    queuedAt: this.now(),
                    lastError: null,
                },
            });

            return {
                jobId: String(job.id ?? jobId),
                queueStatus,
                reused,
            };
        } catch (error) {
            await this.invalidateFailedQueue(queue);
            await this.markQueueFailure(normalizedId);
            this.logger.warn({ reminderId: normalizedId }, "Reminder queue operation failed");

            if (error instanceof ServiceUnavailable) throw error;
            throw new ServiceUnavailable(QUEUE_UNAVAILABLE_MESSAGE);
        }
    };

    enqueueImmediateReminder = async (reminderId) => {
        return await this.enqueueReminder({
            reminderId,
            scheduledFor: this.now(),
            replaceExisting: true,
        });
    };

    removeReminderJob = async (reminderId) => {
        const normalizedId = normalizeReminderId(reminderId);
        const jobId = getReminderJobId(normalizedId);

        let queue;

        try {
            const job = await this.runQueueOperation(async () => {
                queue = await this.queueProvider();
                const queuedJob = await queue.getJob(jobId);

                if (queuedJob) await queuedJob.remove();
                return queuedJob;
            });

            await this.ReminderModel.updateOne({
                _id: normalizedId,
                status: { $ne: "completed" },
            }, {
                $set: {
                    queueStatus: "removed",
                    queueJobId: null,
                },
            });

            return Boolean(job);
        } catch (error) {
            await this.invalidateFailedQueue(queue);
            this.logger.warn({ reminderId: normalizedId }, "Reminder job removal failed");

            if (error instanceof ServiceUnavailable) throw error;
            throw new ServiceUnavailable(QUEUE_UNAVAILABLE_MESSAGE);
        }
    };

    getReminderJob = async (reminderId) => {
        const normalizedId = normalizeReminderId(reminderId);

        let queue;

        try {
            return await this.runQueueOperation(async () => {
                queue = await this.queueProvider();
                return await queue.getJob(getReminderJobId(normalizedId));
            });
        } catch (error) {
            await this.invalidateFailedQueue(queue);
            if (error instanceof ServiceUnavailable) throw error;
            throw new ServiceUnavailable(QUEUE_UNAVAILABLE_MESSAGE);
        }
    };

    markQueueFailure = async (reminderId) => {
        try {
            await this.ReminderModel.updateOne({ _id: reminderId }, {
                $set: {
                    queueStatus: "failed",
                    lastError: QUEUE_UNAVAILABLE_MESSAGE,
                },
            });
        } catch {
            this.logger.warn({ reminderId }, "Unable to persist reminder queue failure");
        }
    };
}

const reminderQueueService = new ReminderQueueService();

const enqueueReminder = (options) => reminderQueueService.enqueueReminder(options);
const enqueueImmediateReminder = (reminderId) => reminderQueueService.enqueueImmediateReminder(reminderId);
const removeReminderJob = (reminderId) => reminderQueueService.removeReminderJob(reminderId);
const getReminderJob = (reminderId) => reminderQueueService.getReminderJob(reminderId);

export {
    DEFAULT_QUEUE_OPERATION_TIMEOUT_MS,
    QUEUE_UNAVAILABLE_MESSAGE,
    REPLACEABLE_JOB_STATES,
    ReminderQueueService,
    enqueueImmediateReminder,
    enqueueReminder,
    getReminderJob,
    removeReminderJob,
};
export default reminderQueueService;
