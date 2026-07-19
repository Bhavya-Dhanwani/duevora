import mongoose from "mongoose";
import createApp from "./src/app.js";
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

let httpServer = null;
let shutdownStarted = false;
let runtimeStartPromise = null;

async function runShutdownStep(resourceName, operation) {
    try {
        await operation();
    } catch (error) {
        logger.error({ resourceName, errorName: error?.name }, "Resource shutdown failed");
    }
}

async function closeHttpServer() {
    if (!httpServer) return;

    const server = httpServer;
    httpServer = null;

    await new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
        server.closeIdleConnections?.();
    });
}

async function stopReminderRuntime() {
    await runShutdownStep("reminder recovery", async () => stopReminderRecovery());
    await runShutdownStep("reminder worker", closeReminderWorker);
    await runShutdownStep("reminder queue", closeReminderQueue);
    await runShutdownStep("Redis connections", closeRedisConnections);
}

async function startReminderRuntime() {
    if (runtimeStartPromise) return await runtimeStartPromise;

    runtimeStartPromise = (async () => {
        const worker = await startReminderWorker();
        if (!worker) return;

        if (shutdownStarted) return;

        await startReminderRecovery();
        if (!shutdownStarted) logger.info("In-process reminder worker is running");
    })();

    try {
        await runtimeStartPromise;
    } finally {
        runtimeStartPromise = null;
    }
}

async function shutdown(signal, exitCode = 0) {
    if (shutdownStarted) return;
    shutdownStarted = true;

    logger.info({ signal }, "Shutting down server");
    await runShutdownStep("HTTP server", closeHttpServer);
    await stopReminderRuntime();
    await runShutdownStep("MongoDB connection", async () => mongoose.connection.close());
    logger.info({ signal }, "Server shutdown complete");
    process.exit(exitCode);
}

function listen(app) {
    return new Promise((resolve, reject) => {
        const server = app.listen(env.PORT);
        server.once("error", reject);
        server.once("listening", () => resolve(server));
    });
}

async function startServer() {
    process.once("SIGINT", () => void shutdown("SIGINT"));
    process.once("SIGTERM", () => void shutdown("SIGTERM"));

    try {
        // MongoDB is authoritative, so HTTP never accepts traffic before it is ready.
        await connectDB();
        if (shutdownStarted) return;

        httpServer = await listen(createApp());
        logger.info({ port: env.PORT }, "Server is running");

        if (
            env.NODE_ENV !== "test"
            && env.REMINDER_QUEUE_ENABLED
            && env.REMINDER_WORKER_IN_PROCESS
        ) {
            // Redis downtime degrades reminder delivery without blocking the API.
            void startReminderRuntime().catch((error) => {
                if (!shutdownStarted) {
                    logger.warn({ errorName: error?.name },
                        "In-process reminder runtime is unavailable; API remains available");
                }
            });
        }
    } catch (error) {
        if (shutdownStarted) return;

        logger.fatal({ errorName: error?.name }, "Server startup failed");
        await runShutdownStep("HTTP server", closeHttpServer);
        await stopReminderRuntime();
        await runShutdownStep("MongoDB connection", async () => mongoose.connection.close());
        process.exit(1);
    }
}

void startServer();
