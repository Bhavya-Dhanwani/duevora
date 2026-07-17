// Importing modules
import { body } from "express-validator";
import validateErrors from "../../../shared/utils/validateErrors.util.js";

const createUnitValidators = [
    // validating name field
    body("name")
        .notEmpty()
        .withMessage("Unit name is required")
        .isString()
        .withMessage("Unit name must be a string"),

    // validating code field
    body("code")
        .notEmpty()
        .withMessage("Unit code is required")
        .isString()
        .withMessage("Unit code must be a string"),

    // validating errors
    validateErrors
];

export { createUnitValidators };
