// Importing modules
import createApp from "./src/app.js";
import connectDB from "./src/shared/config/db.config.js";
import logger from "./src/shared/config/logger.config.js";
import env from "./src/shared/config/env.config.js";
import mongoose from "mongoose";

// function to start the server
async function startServer() {

    try {
        // The database is authoritative for every authenticated request.
        await connectDB();

        // making the app
        const app = createApp();

        // starting the server
        const server = app.listen(env.PORT, () => {
            logger.info({ port: env.PORT }, "Server is running");
        });

        const shutdown = async (signal) => {
            logger.info({ signal }, "Shutting down server");
            server.close(async () => {
                await mongoose.connection.close();
                process.exit(0);
            });
        };

        process.once("SIGINT", () => shutdown("SIGINT"));
        process.once("SIGTERM", () => shutdown("SIGTERM"));
    } catch (error) {
        logger.fatal({ errorName: error.name }, "Server startup failed");
        process.exit(1);
    }

}

// starting the server
startServer();
