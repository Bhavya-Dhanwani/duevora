// Importing modules
import mongoose from "mongoose";
import env from "./env.config.js";
import logger from "./logger.config.js";

// function to connect to the database
async function connectDB() {

    try {
        // The HTTP server must not accept traffic until this promise resolves.
        const connection = await mongoose.connect(env.MONGO_URI);
        logger.info("Connected to the database");
        return connection;
    } catch (error) {
        // Connection errors can contain credential-bearing URIs, so log only safe metadata.
        logger.error({ errorName: error.name }, "Unable to connect to the database");
        throw error;
    }

}

export default connectDB;
