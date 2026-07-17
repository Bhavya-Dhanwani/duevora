// Importing modules
import { body } from "express-validator";
import validateErrors from "../../../shared/utils/validateErrors.util.js";
import mongoose from "mongoose";

const createIncomeValidators = [
    body("incomeNumber").notEmpty().withMessage("Income number is required").isString(),
    body("date").notEmpty().withMessage("Date is required").isISO8601().withMessage("Date must be a valid ISO 8601 date"),
    body("amount").notEmpty().withMessage("Amount is required").isFloat({ min: 0.01 }).withMessage("Amount must be greater than zero"),
    body("categoryId").optional().custom((v) => v === null || mongoose.Types.ObjectId.isValid(v)).withMessage("Invalid Category ID"),
    body("accountId").notEmpty().withMessage("Account reference is required").custom((v) => mongoose.Types.ObjectId.isValid(v)).withMessage("Invalid Account ID"),
    body("description").optional().isString(),
    validateErrors
];

export { createIncomeValidators };
