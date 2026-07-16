// Importing modules
import { body } from "express-validator";
import validateErrors from "../../../shared/utils/validateErrors.util.js";

const onboardValidators = [
    // validating organization name
    body("name")
        .notEmpty()
        .withMessage("Organization name is required")
        .isLength({ min: 2 })
        .withMessage("Organization name must be at least 2 characters long"),

    // validating organization code
    body("code")
        .notEmpty()
        .withMessage("Organization code is required")
        .isLength({ min: 2 })
        .withMessage("Organization code must be at least 2 characters long")
        .isAlphanumeric()
        .withMessage("Organization code must be alphanumeric"),

    // validating first name of employee
    body("firstName")
        .notEmpty()
        .withMessage("First name is required"),

    // validating last name of employee
    body("lastName")
        .notEmpty()
        .withMessage("Last name is required"),

    // validating errors
    validateErrors
];

export { onboardValidators };
