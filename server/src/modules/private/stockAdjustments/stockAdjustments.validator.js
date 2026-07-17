// Importing modules
import { body } from "express-validator";
import validateErrors from "../../../shared/utils/validateErrors.util.js";
import mongoose from "mongoose";

const createStockAdjustmentValidators = [
    // validating warehouseId field
    body("warehouseId")
        .notEmpty()
        .withMessage("Warehouse ID is required")
        .custom((value) => mongoose.Types.ObjectId.isValid(value))
        .withMessage("Invalid Warehouse ID"),

    // validating productId field
    body("productId")
        .notEmpty()
        .withMessage("Product ID is required")
        .custom((value) => mongoose.Types.ObjectId.isValid(value))
        .withMessage("Invalid Product ID"),

    // validating adjustedQuantity field
    body("adjustedQuantity")
        .notEmpty()
        .withMessage("Adjusted quantity is required")
        .isFloat()
        .withMessage("Adjusted quantity must be a number"),

    // validating reason field
    body("reason")
        .optional()
        .isString(),

    // validating date field
    body("date")
        .optional()
        .isISO8601()
        .withMessage("Date must be a valid ISO 8601 date"),

    // validating errors
    validateErrors
];

export { createStockAdjustmentValidators };
