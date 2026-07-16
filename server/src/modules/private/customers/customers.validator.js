// Importing modules
import { body } from "express-validator";
import validateErrors from "../../../shared/utils/validateErrors.util.js";

const createCustomerValidators = [
    // validating name field
    body("name")
        .notEmpty()
        .withMessage("Customer name is required")
        .isLength({ min: 2 })
        .withMessage("Customer name must be at least 2 characters long"),

    // validating email field
    body("email")
        .optional()
        .isEmail()
        .withMessage("Email is invalid"),

    // validating phone field
    body("phone")
        .optional()
        .isString(),

    // validating address field
    body("address")
        .optional()
        .isString(),

    // validating taxNumber field
    body("taxNumber")
        .optional()
        .isString(),

    // validating status field
    body("status")
        .optional()
        .isIn(["active", "inactive"])
        .withMessage("Status must be either active or inactive"),

    // validating errors
    validateErrors
];

export { createCustomerValidators };
