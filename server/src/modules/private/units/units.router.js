// Importing modules
import express from "express";
import UnitsController from "./units.controller.js";
import { createUnitValidators } from "./units.validator.js";
import authMiddleware from "../../../shared/middlewares/auth.middleware.js";
import permissionMiddleware from "../../../shared/middlewares/permission.middleware.js";

const router = express.Router();
const controller = new UnitsController();

/*
    @route POST /api/units
    @desc Create a new unit in the current organization
    @access Private (requires units.create permission)
*/
router.post("/", authMiddleware, permissionMiddleware("units.create"), createUnitValidators, controller.createUnit);

export default router;
