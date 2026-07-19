// Importing modules
import express from "express";
import PurchaseOrdersController from "./purchaseOrders.controller.js";
import { createPurchaseOrderValidators } from "./purchaseOrders.validator.js";
import authMiddleware from "../../../shared/middlewares/auth.middleware.js";
import permissionMiddleware from "../../../shared/middlewares/permission.middleware.js";

// making the router
const router = express.Router();

// creating a PurchaseOrdersController instance
const controller = new PurchaseOrdersController();

/*
    @route POST /api/purchase-orders
    @desc Create a new purchase order in the current organization
    @access Private (requires purchaseOrders.create permission)
*/
router.post("/", authMiddleware, permissionMiddleware("purchaseOrders.create"), createPurchaseOrderValidators, controller.createPurchaseOrder);

/*
    @route GET /api/purchase-orders
    @desc Get all purchase orders for the current organization
    @access Private (requires purchaseOrders.view permission)
*/
router.get("/", authMiddleware, permissionMiddleware("purchaseOrders.view"), controller.listPurchaseOrders);

// exporting the router
export default router;
