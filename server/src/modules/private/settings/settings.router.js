import express from "express";
import SettingsController from "./settings.controller.js";
import { upsertSettingValidators } from "./settings.validator.js";
import authMiddleware from "../../../shared/middlewares/auth.middleware.js";
import permissionMiddleware from "../../../shared/middlewares/permission.middleware.js";

const router = express.Router();
const controller = new SettingsController();

router.put("/", authMiddleware, permissionMiddleware("settings.update"), upsertSettingValidators, controller.upsertSetting);

export default router;
