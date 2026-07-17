// Importing modules
import { body } from "express-validator";
import validateErrors from "../../../shared/utils/validateErrors.util.js";

const createFinancialYearValidators = [
    body("name")
        .notEmpty().withMessage("Financial year name is required").isString(),

    body("startDate")
        .notEmpty().withMessage("Start date is required")
        .isISO8601().withMessage("Start date must be a valid ISO 8601 date"),

    body("endDate")
        .notEmpty().withMessage("End date is required")
        .isISO8601().withMessage("End date must be a valid ISO 8601 date"),

    validateErrors
];

export { createFinancialYearValidators };
