import express from "express";
import RemindersController from "./reminders.controller.js";
import {
    createReminderValidators,
    listReminderValidators,
    reminderIdValidators,
    sendReminderValidators,
} from "./reminders.validator.js";
import authMiddleware from "../../../shared/middlewares/auth.middleware.js";
import permissionMiddleware from "../../../shared/middlewares/permission.middleware.js";

const router = express.Router();
const controller = new RemindersController();

router.post(
    "/",
    authMiddleware,
    permissionMiddleware("reminders.create"),
    createReminderValidators,
    controller.createReminder
);

router.get(
    "/",
    authMiddleware,
    permissionMiddleware("reminders.view"),
    listReminderValidators,
    controller.listReminders
);

router.post(
    "/:reminderId/send",
    authMiddleware,
    permissionMiddleware("reminders.update"),
    sendReminderValidators,
    controller.sendReminder
);

router.patch(
    "/:reminderId/cancel",
    authMiddleware,
    permissionMiddleware("reminders.update"),
    reminderIdValidators,
    controller.cancelReminder
);

router.get(
    "/:reminderId",
    authMiddleware,
    permissionMiddleware("reminders.view"),
    reminderIdValidators,
    controller.getReminder
);

export default router;
