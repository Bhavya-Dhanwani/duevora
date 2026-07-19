import { jest } from "@jest/globals";
import { UnrecoverableError } from "bullmq";
import {
    buildReminderWorker,
    processReminderJob,
    waitForReminderWorkerReady,
} from "../reminder.worker.js";

const reminderId = "507f1f77bcf86cd799439011";
const now = new Date("2026-07-19T10:00:00.000Z");

function createLogger() {
    return {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    };
}

function activeReminder(overrides = {}) {
    return {
        _id: reminderId,
        status: "queued",
        channels: ["email"],
        emailStatus: "pending",
        whatsappStatus: "skipped",
        ...overrides,
    };
}

function job(data = { reminderId }) {
    return { id: `reminder-${reminderId}`, data, attemptsMade: 0 };
}

describe("reminder worker processor", () => {
    it("skips terminal reminders without calling the delivery service", async () => {
        const ReminderModel = {
            findById: jest.fn().mockResolvedValue(activeReminder({ status: "completed" })),
            findOneAndUpdate: jest.fn(),
            updateOne: jest.fn().mockResolvedValue({}),
        };
        const reminderService = { sendReminder: jest.fn() };

        const result = await processReminderJob(job(), {
            ReminderModel,
            reminderService,
            loggerInstance: createLogger(),
        });

        expect(result).toEqual({ skipped: true, status: "completed" });
        expect(reminderService.sendReminder).not.toHaveBeenCalled();
        expect(ReminderModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("acquires a lock and delegates all delivery logic to ReminderService", async () => {
        const locked = activeReminder({ status: "processing" });
        const ReminderModel = {
            findById: jest.fn().mockResolvedValue(activeReminder()),
            findOneAndUpdate: jest.fn().mockResolvedValue(locked),
            updateOne: jest.fn().mockResolvedValue({}),
        };
        const reminderService = {
            sendReminder: jest.fn().mockResolvedValue({ status: "sent" }),
        };

        const result = await processReminderJob(job(), {
            ReminderModel,
            reminderService,
            loggerInstance: createLogger(),
            now: () => new Date(now),
            lockMs: 60000,
        });

        expect(ReminderModel.findOneAndUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ _id: reminderId }),
            expect.objectContaining({
                $set: expect.objectContaining({
                    queueStatus: "processing",
                    processingLockUntil: new Date(now.getTime() + 60000),
                }),
            }),
            expect.objectContaining({ returnDocument: "after" })
        );
        expect(reminderService.sendReminder).toHaveBeenCalledWith({
            reminderId,
            source: "worker",
            jobId: `reminder-${reminderId}`,
            attemptNumber: 1,
            processingBy: `reminder-worker-reminder-${reminderId}-1`,
        });
        expect(result).toEqual({ status: "sent" });
        expect(ReminderModel.updateOne).toHaveBeenLastCalledWith(
            expect.objectContaining({ _id: reminderId, $or: expect.any(Array) }),
            { $set: expect.objectContaining({ queueStatus: "completed" }) }
        );
    });

    it("maps permanent business errors to BullMQ UnrecoverableError", async () => {
        const permanentError = Object.assign(new Error("invalid customer"), { permanent: true });
        const ReminderModel = {
            findById: jest.fn().mockResolvedValue(activeReminder()),
            findOneAndUpdate: jest.fn().mockResolvedValue(activeReminder()),
            updateOne: jest.fn().mockResolvedValue({}),
        };

        await expect(processReminderJob(job(), {
            ReminderModel,
            reminderService: { sendReminder: jest.fn().mockRejectedValue(permanentError) },
            loggerInstance: createLogger(),
            now: () => new Date(now),
        })).rejects.toBeInstanceOf(UnrecoverableError);

        expect(ReminderModel.updateOne).toHaveBeenLastCalledWith(
            expect.any(Object),
            { $set: expect.objectContaining({ queueStatus: "failed", nextAttemptAt: null }) }
        );
    });

    it("rethrows retryable provider errors for BullMQ backoff", async () => {
        const retryableError = Object.assign(new Error("provider unavailable"), { retryable: true });
        const ReminderModel = {
            findById: jest.fn().mockResolvedValue(activeReminder()),
            findOneAndUpdate: jest.fn().mockResolvedValue(activeReminder()),
            updateOne: jest.fn().mockResolvedValue({}),
        };

        await expect(processReminderJob(job(), {
            ReminderModel,
            reminderService: { sendReminder: jest.fn().mockRejectedValue(retryableError) },
            loggerInstance: createLogger(),
            now: () => new Date(now),
        })).rejects.toBe(retryableError);

        expect(ReminderModel.updateOne).toHaveBeenLastCalledWith(
            expect.any(Object),
            { $set: expect.objectContaining({
                queueStatus: "failed",
                nextAttemptAt: new Date(now.getTime() + 60000),
            }) }
        );
    });

    it("retries when another delivery process still owns the authoritative lock", async () => {
        const ReminderModel = {
            findById: jest.fn().mockResolvedValue(activeReminder()),
            findOneAndUpdate: jest.fn().mockResolvedValue(activeReminder()),
            updateOne: jest.fn().mockResolvedValue({}),
        };

        await expect(processReminderJob(job(), {
            ReminderModel,
            reminderService: {
                sendReminder: jest.fn().mockResolvedValue({ skipped: true, processing: true }),
            },
            loggerInstance: createLogger(),
            now: () => new Date(now),
        })).rejects.toMatchObject({ retryable: true });

        expect(ReminderModel.updateOne.mock.calls).not.toContainEqual([
            expect.any(Object),
            { $set: expect.objectContaining({ queueStatus: "completed" }) },
        ]);
        expect(ReminderModel.updateOne).toHaveBeenLastCalledWith(
            expect.any(Object),
            { $set: expect.objectContaining({ queueStatus: "failed" }) }
        );
    });

    it("rejects job payloads containing anything beyond reminderId", async () => {
        await expect(processReminderJob(job({ reminderId, email: "private@example.com" }), {
            ReminderModel: {},
            reminderService: { sendReminder: jest.fn() },
        })).rejects.toBeInstanceOf(UnrecoverableError);
    });
});

describe("reminder worker factory", () => {
    it("uses configured concurrency and registers safe lifecycle handlers", () => {
        const connection = {};
        const eventNames = [];
        const WorkerClass = jest.fn(function FakeWorker(name, processor, options) {
            this.name = name;
            this.processor = processor;
            this.options = options;
            this.on = jest.fn((eventName) => eventNames.push(eventName));
        });

        const worker = buildReminderWorker({
            WorkerClass,
            connection,
            loggerInstance: createLogger(),
            config: {
                REMINDER_QUEUE_NAME: "test-reminders",
                BULLMQ_PREFIX: "test-prefix",
                REMINDER_WORKER_CONCURRENCY: 7,
            },
        });

        expect(worker.options).toEqual({
            connection,
            prefix: "test-prefix",
            concurrency: 7,
        });
        expect(eventNames).toEqual(["completed", "failed", "stalled", "error"]);
    });

    it("closes a Worker after Redis readiness fails", async () => {
        const connectionError = new Error("Redis unavailable");
        const worker = {
            waitUntilReady: jest.fn().mockRejectedValue(connectionError),
        };
        const cleanup = jest.fn().mockResolvedValue();

        await expect(waitForReminderWorkerReady(worker, cleanup)).rejects.toBe(connectionError);

        expect(cleanup).toHaveBeenCalledWith(true);
    });

    it("keeps a ready Worker running", async () => {
        const worker = {
            waitUntilReady: jest.fn().mockResolvedValue(),
        };
        const cleanup = jest.fn();

        await expect(waitForReminderWorkerReady(worker, cleanup)).resolves.toBe(worker);
        expect(cleanup).not.toHaveBeenCalled();
    });
});
