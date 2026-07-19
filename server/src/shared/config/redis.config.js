import IORedis from "ioredis";
import env from "./env.config.js";
import logger from "./logger.config.js";

const redisConnections = new Set();
const REQUEST_REDIS_CONNECT_TIMEOUT_MS = 3000;
const REQUEST_REDIS_COMMAND_TIMEOUT_MS = 3000;
const REDIS_HEALTH_TIMEOUT_MS = 1000;

function getRedisConnectionOptions({ requestBounded = false } = {}) {
    const options = {
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
        lazyConnect: true,
    };

    if (!requestBounded) return options;

    return {
        ...options,
        // Request-facing producers must return a controlled error instead of
        // waiting indefinitely for Redis. Workers intentionally retain the
        // BullMQ-required null value above so blocking reads keep retrying.
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        connectTimeout: REQUEST_REDIS_CONNECT_TIMEOUT_MS,
        commandTimeout: REQUEST_REDIS_COMMAND_TIMEOUT_MS,
    };
}

function createRedisConnection(connectionName = "bullmq", options = {}) {
    const connection = new IORedis(env.REDIS_URL, {
        ...getRedisConnectionOptions(options),
        connectionName,
    });

    redisConnections.add(connection);

    connection.on("connect", () => {
        logger.debug({ connectionName }, "Redis connection established");
    });

    connection.on("error", (error) => {
        // Redis URLs and command payloads may contain credentials or PII.
        logger.warn({ connectionName, errorName: error.name }, "Redis connection error");
    });

    connection.on("end", () => {
        redisConnections.delete(connection);
    });

    return connection;
}

async function closeRedisConnection(connection) {
    if (!connection) return;

    redisConnections.delete(connection);

    try {
        if (["ready", "connect", "connecting"].includes(connection.status)) {
            await connection.quit();
        } else {
            connection.disconnect();
        }
    } catch {
        connection.disconnect();
    }
}

async function closeRedisConnections() {
    await Promise.allSettled(
        Array.from(redisConnections, (connection) => closeRedisConnection(connection))
    );
}

async function checkRedisHealth({
    connectionFactory = createRedisConnection,
    closeConnection = closeRedisConnection,
    timeoutMs = REDIS_HEALTH_TIMEOUT_MS,
} = {}) {
    let connection;
    let timeout;

    try {
        connection = connectionFactory("redis-health", { requestBounded: true });
        const healthOperation = (async () => {
            if (connection.status === "wait") await connection.connect();
            return await connection.ping();
        })();
        const timeoutOperation = new Promise((_, reject) => {
            timeout = setTimeout(() => reject(new Error("Redis health check timed out")), timeoutMs);
            timeout.unref?.();
        });
        const response = await Promise.race([healthOperation, timeoutOperation]);

        return response === "PONG" ? "available" : "unavailable";
    } catch {
        return "unavailable";
    } finally {
        clearTimeout(timeout);
        await closeConnection(connection);
    }
}

export {
    REDIS_HEALTH_TIMEOUT_MS,
    REQUEST_REDIS_COMMAND_TIMEOUT_MS,
    REQUEST_REDIS_CONNECT_TIMEOUT_MS,
    closeRedisConnection,
    closeRedisConnections,
    checkRedisHealth,
    createRedisConnection,
    getRedisConnectionOptions,
};
