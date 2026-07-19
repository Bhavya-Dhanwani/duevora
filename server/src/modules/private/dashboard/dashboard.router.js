import express from "express";
import DashboardController from "./dashboard.controller.js";
import authMiddleware from "../../../shared/middlewares/auth.middleware.js";
import permissionMiddleware from "../../../shared/middlewares/permission.middleware.js";

const router = express.Router();
const controller = new DashboardController();

/*
    @route GET /api/dashboard/summary
    @desc Retrieve the current organization's seller dashboard summary
    @access Private (requires dashboard.view permission)
*/
router.get("/summary", authMiddleware, permissionMiddleware("dashboard.view"), controller.summary);

export default router;
