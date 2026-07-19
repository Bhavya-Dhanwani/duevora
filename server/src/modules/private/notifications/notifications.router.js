// Importing modules
import express from "express";
import NotificationsController from "./notifications.controller.js";
import authMiddleware from "../../../shared/middlewares/auth.middleware.js";
import permissionMiddleware from "../../../shared/middlewares/permission.middleware.js";

// making the router
const router = express.Router();

// creating a NotificationsController instance
const controller = new NotificationsController();

/*
    @route GET /api/notifications
    @desc List notifications for the current user
    @access Private (requires notifications.view permission)
*/
router.get("/", authMiddleware, controller.listNotifications);

// exporting the router
export default router;
