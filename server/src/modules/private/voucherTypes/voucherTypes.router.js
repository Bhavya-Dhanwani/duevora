// Importing modules
import express from "express";
import VoucherTypesController from "./voucherTypes.controller.js";
import { createVoucherTypeValidators } from "./voucherTypes.validator.js";
import authMiddleware from "../../../shared/middlewares/auth.middleware.js";
import permissionMiddleware from "../../../shared/middlewares/permission.middleware.js";

// making the router
const router = express.Router();

// creating a VoucherTypesController instance
const controller = new VoucherTypesController();

/*
    @route POST /api/voucher-types
    @desc Create a new voucher type
    @access Private (requires voucherTypes.create permission)
*/
router.post("/", authMiddleware, permissionMiddleware("voucherTypes.create"), createVoucherTypeValidators, controller.createVoucherType);

router.get("/", authMiddleware, permissionMiddleware("voucherTypes.view"), controller.listVoucherTypes);

// exporting the router
export default router;
