import { jest } from "@jest/globals";
import { getSystemHealth } from "../health.service.js";
import { createHealthHandler } from "../../routers/health.router.js";

describe("system health reporting", () => {
    it("reports healthy in-process infrastructure without exposing configuration", async () => {
        const result = await getSystemHealth({
            config: {
                REMINDER_QUEUE_ENABLED: true,
                REMINDER_WORKER_IN_PROCESS: true,
            },
            mongoConnection: { readyState: 1 },
            redisCheck: jest.fn().mockResolvedValue("available"),
            workerProvider: () => ({ isRunning: () => true }),
        });

        expect(result).toEqual({
            status: "healthy",
            mongodb: { status: "connected" },
            redis: { status: "available" },
            reminderQueue: { enabled: true, status: "available" },
            worker: { mode: "in_process", status: "running" },
        });
        expect(JSON.stringify(result)).not.toMatch(/REDIS_URL|password|token|smtp/i);
    });

    it("reports degraded Redis while identifying separate-worker mode honestly", async () => {
        const result = await getSystemHealth({
            config: {
                REMINDER_QUEUE_ENABLED: true,
                REMINDER_WORKER_IN_PROCESS: false,
            },
            mongoConnection: { readyState: 1 },
            redisCheck: jest.fn().mockResolvedValue("unavailable"),
        });

        expect(result.status).toBe("degraded");
        expect(result.redis.status).toBe("unavailable");
        expect(result.reminderQueue.status).toBe("degraded");
        expect(result.worker).toEqual({ mode: "separate_process", status: "external" });
    });

    it("skips Redis checks when reminder queueing is disabled", async () => {
        const redisCheck = jest.fn();
        const result = await getSystemHealth({
            config: {
                REMINDER_QUEUE_ENABLED: false,
                REMINDER_WORKER_IN_PROCESS: false,
            },
            mongoConnection: { readyState: 1 },
            redisCheck,
        });

        expect(result.status).toBe("healthy");
        expect(result.redis.status).toBe("disabled");
        expect(result.worker).toEqual({ mode: "disabled", status: "disabled" });
        expect(redisCheck).not.toHaveBeenCalled();
    });

    it("returns a normal 200 response for degraded health", async () => {
        const response = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        const handler = createHealthHandler(jest.fn().mockResolvedValue({
            status: "degraded",
            mongodb: { status: "connected" },
            redis: { status: "unavailable" },
            reminderQueue: { enabled: true, status: "degraded" },
            worker: { mode: "in_process", status: "not_started" },
        }));

        await handler({}, response);

        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json.mock.calls[0][0].message).toBe("Server is degraded");
    });
});
