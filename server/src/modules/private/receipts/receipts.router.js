// Importing modules
import express from "express";
import ReceiptsController from "./receipts.controller.js";
import { createReceiptValidators } from "./receipts.validator.js";
import authMiddleware from "../../../shared/middlewares/auth.middleware.js";
import permissionMiddleware from "../../../shared/middlewares/permission.middleware.js";

// making the router
const router = express.Router();

// creating a ReceiptsController instance
const controller = new ReceiptsController();

/*
    @route POST /api/receipts
    @desc Record a customer payment receipt
    @access Private (requires receipts.create permission)
*/
router.post("/", authMiddleware, permissionMiddleware("receipts.create"), createReceiptValidators, controller.createReceipt);

router.get("/", authMiddleware, permissionMiddleware("receipts.view"), controller.listReceipts);

// exporting the router
export default router;
