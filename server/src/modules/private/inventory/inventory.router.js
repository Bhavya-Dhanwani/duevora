// Importing modules
import express from "express";
import InventoryController from "./inventory.controller.js";
import { listInventoryValidators } from "./inventory.validator.js";
import authMiddleware from "../../../shared/middlewares/auth.middleware.js";
import permissionMiddleware from "../../../shared/middlewares/permission.middleware.js";

const router = express.Router();
const controller = new InventoryController();

/*
    @route GET /api/inventory
    @desc List inventory levels with pagination and optional filters
    @access Private (requires inventory.view permission)
*/
router.get("/", authMiddleware, permissionMiddleware("inventory.view"), listInventoryValidators, controller.listInventory);

export default router;
