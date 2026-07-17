// Importing modules
import express from "express";
import QuotationsController from "./quotations.controller.js";
import { createQuotationValidators, approveQuotationValidators } from "./quotations.validator.js";
import authMiddleware from "../../../shared/middlewares/auth.middleware.js";
import permissionMiddleware from "../../../shared/middlewares/permission.middleware.js";

const router = express.Router();
const controller = new QuotationsController();

/*
    @route POST /api/quotations
    @desc Create a new quotation in the current organization
    @access Private (requires quotations.create permission)
*/
router.post("/", authMiddleware, permissionMiddleware("quotations.create"), createQuotationValidators, controller.createQuotation);

/*
    @route POST /api/quotations/:quotationId/approve
    @desc Approve a quotation
    @access Private (requires quotations.update permission)
*/
router.post("/:quotationId/approve", authMiddleware, permissionMiddleware("quotations.update"), approveQuotationValidators, controller.approveQuotation);

export default router;
