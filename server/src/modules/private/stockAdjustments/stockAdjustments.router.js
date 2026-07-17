// Importing modules
import express from "express";
import StockAdjustmentsController from "./stockAdjustments.controller.js";
import { createStockAdjustmentValidators } from "./stockAdjustments.validator.js";
import authMiddleware from "../../../shared/middlewares/auth.middleware.js";
import permissionMiddleware from "../../../shared/middlewares/permission.middleware.js";

const router = express.Router();
const controller = new StockAdjustmentsController();

/*
    @route POST /api/stock-adjustments
    @desc Create a new stock adjustment in the current organization
    @access Private (requires stockAdjustments.create permission)
*/
router.post("/", authMiddleware, permissionMiddleware("stockAdjustments.create"), createStockAdjustmentValidators, controller.createStockAdjustment);

export default router;
