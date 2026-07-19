import express from "express";
import Ok from "../responses/Ok.response.js";
import getSystemHealth from "../services/health.service.js";

function createHealthHandler(healthProvider = getSystemHealth) {
    return async (req, res) => {
        const health = await healthProvider();
        return Ok(
            res,
            health.status === "healthy" ? "Server is healthy" : "Server is degraded",
            health
        );
    };
}

const router = express.Router();
router.get("/", createHealthHandler());

export { createHealthHandler };
export default router;
