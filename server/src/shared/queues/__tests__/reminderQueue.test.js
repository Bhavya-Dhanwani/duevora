import { jest } from "@jest/globals";
import ServiceUnavailable from "../../errors/ServiceUnavailable.error.js";
import {
    REQUEST_REDIS_COMMAND_TIMEOUT_MS,
    REQUEST_REDIS_CONNECT_TIMEOUT_MS,
    getRedisConnectionOptions,
} from "../../config/redis.config.js";
import {
    COMPLETED_JOB_RETENTION,
    FAILED_JOB_RETENTION,
    attachReminderQueueEvents,
    buildReminderQueue,
    getReminderDefaultJobOptions,
    getReminderJobId,
} from "../reminder.queue.js";
import { ReminderQueueService } from "../../services/reminderQueue.service.js";

const config = {
    REMINDER_QUEUE_ENABLED: true,
    REMINDER_QUEUE_NAME: "test-reminders",
    BULLMQ_PREFIX: "test-prefix",
    REMINDER_JOB_ATTEMPTS: 4,
    REMINDER_JOB_BACKOFF_MS: 2500,
};

function createLogger() {
    return {
        warn: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
    };
}

describe("reminder queue factory", () => {
    it("keeps worker retries durable while bounding request-facing producers", () => {
        expect(getRedisConnectionOptions()).toMatchObject({
            maxRetriesPerRequest: null,
            lazyConnect: true,
        });
        expect(getRedisConnectionOptions({ requestBounded: true })).toMatchObject({
            maxRetriesPerRequest: 1,
            enableOfflineQueue: false,
            connectTimeout: REQUEST_REDIS_CONNECT_TIMEOUT_MS,
            commandTimeout: REQUEST_REDIS_COMMAND_TIMEOUT_MS,
        });
    });

    it("builds a queue with retry, backoff and bounded retention defaults", () => {
        const connection = { status: "wait" };
        const QueueClass = jest.fn(function FakeQueue(name, options) {
            this.name = name;
            this.options = options;
        });

        const queue = buildReminderQueue({ QueueClass, config, connection });

        expect(queue.name).toBe("test-reminders");
        expect(queue.options).toEqual({
            connection,
            prefix: "test-prefix",
            defaultJobOptions: {
                attempts: 4,
                backoff: { type: "exponential", delay: 2500 },
                removeOnComplete: COMPLETED_JOB_RETENTION,
                removeOnFail: FAILED_JOB_RETENTION,
            },
        });
    });

    it("uses deterministic BullMQ-safe IDs", () => {
        expect(getReminderJobId("507f1f77bcf86cd799439011"))
            .toBe("reminder-507f1f77bcf86cd799439011");
        expect(() => getReminderJobId("bad:id")).toThrow("valid reminder ID");
    });

    it("refuses to construct a disabled queue before using Redis", () => {
        expect(() => buildReminderQueue({
            QueueClass: jest.fn(),
            config: { ...config, REMINDER_QUEUE_ENABLED: false },
            connection: {},
        })).toThrow(ServiceUnavailable);
    });

    it("exposes independently testable default job options", () => {
        expect(getReminderDefaultJobOptions(config)).toMatchObject({
            attempts: 4,
            backoff: { type: "exponential", delay: 2500 },
        });
    });

    it("sanitizes BullMQ connection errors before logging them", () => {
        const listeners = {};
        const queue = {
            on: jest.fn((eventName, listener) => {
                listeners[eventName] = listener;
            }),
        };
        const loggerInstance = createLogger();

        attachReminderQueueEvents(queue, loggerInstance);
        listeners.error(new Error("redis://user:secret@host"));

        expect(loggerInstance.warn).toHaveBeenCalledWith(
            { errorName: "Error" },
            "Reminder queue error"
        );
        expect(loggerInstance.warn.mock.calls.flat().join(" ")).not.toContain("secret");
    });
});

describe("ReminderQueueService", () => {
    const reminderId = "507f1f77bcf86cd799439011";
    const now = new Date("2026-07-19T10:00:00.000Z");

    function setup({ existingJob = null, addError = null, enabled = true } = {}) {
        const addedJob = {
            id: `reminder-${reminderId}`,
            getState: jest.fn().mockResolvedValue("waiting"),
            remove: jest.fn(),
        };
        const queue = {
            getJob: jest.fn().mockResolvedValue(existingJob),
            add: addError
                ? jest.fn().mockRejectedValue(addError)
                : jest.fn().mockResolvedValue(addedJob),
        };
        const ReminderModel = { updateOne: jest.fn().mockResolvedValue({ matchedCount: 1 }) };
        const loggerInstance = createLogger();
        const queueInvalidator = jest.fn().mockResolvedValue(true);
        const service = new ReminderQueueService({
            config: { ...config, REMINDER_QUEUE_ENABLED: enabled },
            queueProvider: jest.fn().mockResolvedValue(queue),
            queueInvalidator,
            ReminderModel,
            loggerInstance,
            now: () => new Date(now),
        });

        return {
            addedJob,
            loggerInstance,
            queue,
            queueInvalidator,
            ReminderModel,
            service,
        };
    }

    it("enqueues only a reminder ID with a deterministic delayed job ID", async () => {
        const context = setup();
        const result = await context.service.enqueueReminder({
            reminderId,
            scheduledFor: new Date(now.getTime() + 5000),
        });

        expect(context.queue.add).toHaveBeenCalledWith(
            "send-reminder",
            { reminderId },
            { jobId: `reminder-${reminderId}`, delay: 5000 }
        );
        expect(Object.keys(context.queue.add.mock.calls[0][1])).toEqual(["reminderId"]);
        expect(context.ReminderModel.updateOne).toHaveBeenCalledWith(
            { _id: reminderId },
            { $set: expect.objectContaining({
                queueJobId: `reminder-${reminderId}`,
                queueStatus: "queued",
                queuedAt: now,
            }) }
        );
        expect(result).toEqual({
            jobId: `reminder-${reminderId}`,
            queueStatus: "queued",
            reused: false,
        });
    });

    it("reuses an existing job unless delayed replacement is explicit", async () => {
        const existingJob = {
            id: `reminder-${reminderId}`,
            getState: jest.fn().mockResolvedValue("delayed"),
            remove: jest.fn(),
        };
        const context = setup({ existingJob });

        const result = await context.service.enqueueReminder({
            reminderId,
            scheduledFor: now,
        });

        expect(existingJob.remove).not.toHaveBeenCalled();
        expect(context.queue.add).not.toHaveBeenCalled();
        expect(result.reused).toBe(true);
    });

    it.each(["delayed", "failed", "completed"])(
        "replaces a removable %s job for an explicit immediate send",
        async (state) => {
            const existingJob = {
                id: `reminder-${reminderId}`,
                getState: jest.fn().mockResolvedValue(state),
                remove: jest.fn().mockResolvedValue(undefined),
            };
            const context = setup({ existingJob });

            await context.service.enqueueImmediateReminder(reminderId);

            expect(existingJob.remove).toHaveBeenCalledTimes(1);
            expect(context.queue.add).toHaveBeenCalledWith(
                "send-reminder",
                { reminderId },
                { jobId: `reminder-${reminderId}`, delay: 0 }
            );
        }
    );

    it.each(["active", "waiting"])(
        "does not replace an in-flight %s job for an explicit immediate send",
        async (state) => {
            const existingJob = {
                id: `reminder-${reminderId}`,
                getState: jest.fn().mockResolvedValue(state),
                remove: jest.fn().mockResolvedValue(undefined),
            };
            const context = setup({ existingJob });

            const result = await context.service.enqueueImmediateReminder(reminderId);

            expect(existingJob.remove).not.toHaveBeenCalled();
            expect(context.queue.add).not.toHaveBeenCalled();
            expect(result.reused).toBe(true);
        }
    );

    it("persists a controlled queue failure without exposing Redis errors", async () => {
        const context = setup({ addError: new Error("redis://user:secret@host") });

        await expect(context.service.enqueueReminder({ reminderId, scheduledFor: now }))
            .rejects.toThrow(ServiceUnavailable);
        expect(context.ReminderModel.updateOne).toHaveBeenLastCalledWith(
            { _id: reminderId },
            { $set: {
                queueStatus: "failed",
                lastError: "Reminder scheduling is temporarily unavailable.",
            } }
        );
        expect(context.loggerInstance.warn.mock.calls.flat().join(" ")).not.toContain("secret");
        expect(context.queueInvalidator).toHaveBeenCalledWith(context.queue);
    });

    it("does not request a queue when scheduling is disabled", async () => {
        const context = setup({ enabled: false });

        await expect(context.service.enqueueReminder({ reminderId, scheduledFor: now }))
            .rejects.toThrow(ServiceUnavailable);
        expect(context.queue.getJob).not.toHaveBeenCalled();
    });

    it("bounds a stalled queue operation and returns a controlled 503", async () => {
        const ReminderModel = { updateOne: jest.fn().mockResolvedValue({ matchedCount: 1 }) };
        const loggerInstance = createLogger();
        const service = new ReminderQueueService({
            config,
            queueProvider: jest.fn(() => new Promise(() => {})),
            ReminderModel,
            loggerInstance,
            now: () => new Date(now),
            operationTimeoutMs: 10,
        });

        await expect(service.enqueueReminder({ reminderId, scheduledFor: now }))
            .rejects.toMatchObject({
                statusCode: 503,
                message: "Reminder scheduling is temporarily unavailable.",
            });
        expect(ReminderModel.updateOne).toHaveBeenCalledWith(
            { _id: reminderId },
            { $set: {
                queueStatus: "failed",
                lastError: "Reminder scheduling is temporarily unavailable.",
            } }
        );
    });

    it("does not downgrade completed reminders while removing paid jobs", async () => {
        const existingJob = {
            id: `reminder-${reminderId}`,
            getState: jest.fn().mockResolvedValue("delayed"),
            remove: jest.fn().mockResolvedValue(undefined),
        };
        const context = setup({ existingJob });

        await expect(context.service.removeReminderJob(reminderId)).resolves.toBe(true);

        expect(existingJob.remove).toHaveBeenCalledTimes(1);
        expect(context.ReminderModel.updateOne).toHaveBeenCalledWith(
            { _id: reminderId, status: { $ne: "completed" } },
            { $set: { queueStatus: "removed", queueJobId: null } }
        );
    });
});
