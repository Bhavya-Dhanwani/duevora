// Importing modules
import express from "express";
import hpp from "hpp";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import env from "../config/env.config.js";

// function to apply middlewares to the app
function applyMiddlewares(app) {

    // applying middlewares
    app.use(hpp()); // to protect against HTTP Parameter Pollution attacks

    app.use(compression()); // to compress response bodies for all request that traverse through the middleware
    
    app.use(cors()); // to enable CORS (Cross-Origin Resource Sharing) for all routes

    app.use(helmet({
        crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
        contentSecurityPolicy: {
            directives: {
                "script-src": ["'self'", "https://accounts.google.com/gsi/client"],
                "style-src": ["'self'", "'unsafe-inline'", "https://accounts.google.com/gsi/style"],
                "connect-src": ["'self'", "https://accounts.google.com/gsi/"],
                "frame-src": ["'self'", "https://accounts.google.com/gsi/"],
            },
        },
    })); // to secure the app while allowing Google Identity Services

    app.use(cookieParser()); // to parse Cookie header and populate req.cookies with an object keyed by the cookie names

    // Production application logs are emitted by Pino as structured JSON.
    // Morgan remains a development aid because its text format is not JSON.
    if (env.NODE_ENV !== "production") {
        app.use(morgan("dev"));
    }

    app.use(express.json({ limit: "100kb" })); // to parse incoming requests with JSON payloads and is based on body-parser

    app.use(express.urlencoded({ extended: true, limit: "100kb" })); // to parse incoming requests with URL-encoded payloads and is based on body-parser

}

export default applyMiddlewares;
