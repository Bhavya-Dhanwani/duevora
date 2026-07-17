// Importing modules
import { body, param } from "express-validator";
import validateErrors from "../../../shared/utils/validateErrors.util.js";
import mongoose from "mongoose";

const createQuotationValidators = [
    body("customerId").notEmpty().withMessage("Customer is required").custom((v) => mongoose.Types.ObjectId.isValid(v)).withMessage("Invalid Customer ID"),
    body("quotationNumber").notEmpty().withMessage("Quotation number is required").isString(),
    body("date").notEmpty().withMessage("Date is required").isISO8601().withMessage("Must be a valid date"),
    body("expiryDate").optional().isISO8601().withMessage("Must be a valid date"),
    body("subTotal").notEmpty().withMessage("Subtotal is required").isFloat({ min: 0 }),
    body("taxTotal").optional().isFloat({ min: 0 }),
    body("grandTotal").notEmpty().withMessage("Grand total is required").isFloat({ min: 0 }),
    body("status").optional().isIn(["draft", "sent", "accepted", "rejected", "expired"]).withMessage("Invalid status"),
    validateErrors
];

const approveQuotationValidators = [
    // validating quotationId param
    param("quotationId")
        .notEmpty()
        .withMessage("Quotation ID is required")
        .custom((value) => mongoose.Types.ObjectId.isValid(value))
        .withMessage("Invalid Quotation ID"),

    // validating errors
    validateErrors
];

export { createQuotationValidators, approveQuotationValidators };
