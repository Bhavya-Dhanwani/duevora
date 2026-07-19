// Importing modules
import pino from "pino";
import env from "./env.config.js";

const developmentTransport = env.NODE_ENV === "development" ? {
    target: "pino-pretty",
    options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
    },
} : undefined;

// Production and test intentionally avoid the development-only pretty transport.
const logger = pino({
    level: env.NODE_ENV === "test" ? "silent" : env.NODE_ENV === "production" ? "info" : "debug",
    ...(developmentTransport && { transport: developmentTransport }),
});

export default logger;
