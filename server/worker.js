import mongoose from "mongoose";
import connectDB from "./src/shared/config/db.config.js";
import env from "./src/shared/config/env.config.js";
import logger from "./src/shared/config/logger.config.js";
import { closeRedisConnections } from "./src/shared/config/redis.config.js";
import { closeReminderQueue } from "./src/shared/queues/reminder.queue.js";
import {
    startReminderRecovery,
    stopReminderRecovery,
} from "./src/shared/services/reminderRecovery.service.js";
import {
    closeReminderWorker,
    startReminderWorker,
} from "./src/shared/workers/reminder.worker.js";

let shutdownStarted = false;

async function runShutdownStep(resourceName, operation) {
    try {
        await operation();
    } catch (error) {
        logger.error({ resourceName, errorName: error?.name }, "Resource shutdown failed");
    }
}

async function stopRuntime() {
    await runShutdownStep("reminder recovery", async () => stopReminderRecovery());
    await runShutdownStep("reminder worker", closeReminderWorker);
    await runShutdownStep("reminder queue", closeReminderQueue);
    await runShutdownStep("Redis connections", closeRedisConnections);
}

async function shutdown(signal, exitCode = 0) {
    if (shutdownStarted) return;
    shutdownStarted = true;

    logger.info({ signal }, "Shutting down reminder worker process");
    await stopRuntime();
    await runShutdownStep("MongoDB connection", async () => mongoose.connection.close());
    logger.info({ signal }, "Reminder worker process shutdown complete");
    process.exit(exitCode);
}

async function startWorkerProcess() {
    if (env.NODE_ENV === "test") {
        logger.info("Reminder worker is disabled in the test environment");
        return;
    }

    if (!env.REMINDER_QUEUE_ENABLED) {
        logger.info("Reminder worker is disabled because the reminder queue is disabled");
        return;
    }

    process.once("SIGINT", () => void shutdown("SIGINT"));
    process.once("SIGTERM", () => void shutdown("SIGTERM"));

    try {
        await connectDB();
        if (shutdownStarted) return;

        const worker = await startReminderWorker();
        if (shutdownStarted) return;

        await startReminderRecovery();
        logger.info("Reminder worker process is running");
    } catch (error) {
        if (shutdownStarted) return;

        logger.fatal({ errorName: error?.name }, "Reminder worker startup failed");
        await stopRuntime();
        await runShutdownStep("MongoDB connection", async () => mongoose.connection.close());
        process.exit(1);
    }
}

void startWorkerProcess();
