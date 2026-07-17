// Importing modules
import { body } from "express-validator";
import validateErrors from "../../../shared/utils/validateErrors.util.js";

const createAccountValidators = [
    // validating name field
    body("name")
        .notEmpty()
        .withMessage("Account name is required")
        .isString()
        .trim(),

    // validating code field
    body("code")
        .notEmpty()
        .withMessage("Account code is required")
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage("Account code must be alphanumeric or contain underscores")
        .trim(),

    // validating type field
    body("type")
        .notEmpty()
        .withMessage("Account type is required")
        .isIn(["asset", "liability", "equity", "revenue", "expense"])
        .withMessage("Invalid account type"),

    // validating status field
    body("status")
        .optional()
        .isIn(["active", "inactive"])
        .withMessage("Invalid status"),

    // validating errors
    validateErrors
];

export { createAccountValidators };
