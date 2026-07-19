// Importing modules
import express from "express";
import WarehousesController from "./warehouses.controller.js";
import { createWarehouseValidators } from "./warehouses.validator.js";
import authMiddleware from "../../../shared/middlewares/auth.middleware.js";
import permissionMiddleware from "../../../shared/middlewares/permission.middleware.js";

// making the router
const router = express.Router();

// creating a WarehousesController instance
const controller = new WarehousesController();

/*
    @route POST /api/warehouses
    @desc Create a new warehouse in the current organization
    @access Private (requires warehouses.create permission)
*/
router.post("/", authMiddleware, permissionMiddleware("warehouses.create"), createWarehouseValidators, controller.createWarehouse);

/*
    @route GET /api/warehouses
    @desc List warehouses in the current organization
    @access Private (requires warehouses.view permission)
*/
router.get("/", authMiddleware, permissionMiddleware("warehouses.view"), controller.listWarehouses);

// exporting the router
export default router;
