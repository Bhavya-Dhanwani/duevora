import mongoose from "mongoose";
import env from "../config/env.config.js";
import { checkRedisHealth } from "../config/redis.config.js";
import { getReminderWorker } from "../workers/reminder.worker.js";

const MONGO_STATES = ["disconnected", "connected", "connecting", "disconnecting"];

async function getSystemHealth({
    config = env,
    mongoConnection = mongoose.connection,
    redisCheck = checkRedisHealth,
    workerProvider = getReminderWorker,
} = {}) {
    const mongoStatus = MONGO_STATES[mongoConnection.readyState] || "unknown";
    const queueEnabled = config.REMINDER_QUEUE_ENABLED;
    const redisStatus = queueEnabled ? await redisCheck() : "disabled";
    const queueStatus = !queueEnabled
        ? "disabled"
        : redisStatus === "available" ? "available" : "degraded";

    let workerMode = "disabled";
    let workerStatus = "disabled";

    if (queueEnabled && config.REMINDER_WORKER_IN_PROCESS) {
        const worker = workerProvider();
        workerMode = "in_process";
        workerStatus = worker
            ? (worker.isRunning?.() ? "running" : "starting")
            : "not_started";
    } else if (queueEnabled) {
        workerMode = "separate_process";
        workerStatus = "external";
    }

    const status = mongoStatus === "connected"
        && (!queueEnabled || redisStatus === "available")
        ? "healthy"
        : "degraded";

    return {
        status,
        mongodb: { status: mongoStatus },
        redis: { status: redisStatus },
        reminderQueue: {
            enabled: queueEnabled,
            status: queueStatus,
        },
        worker: {
            mode: workerMode,
            status: workerStatus,
        },
    };
}

export { getSystemHealth };
export default getSystemHealth;
