// Importing modules
import { query, param, body } from "express-validator";
import validateErrors from "../../../shared/utils/validateErrors.util.js";
import mongoose from "mongoose";

const listUsersValidators = [
    // validating page query param
    query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer"),

    // validating limit query param
    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100"),

    // validating sortOrder query param
    query("sortOrder")
        .optional()
        .isIn(["asc", "desc"])
        .withMessage("Sort order must be either asc or desc"),

    // validating errors
    validateErrors
];

const updateUserValidators = [
    // validating userId param
    param("userId")
        .notEmpty()
        .withMessage("User ID is required")
        .custom((value) => mongoose.Types.ObjectId.isValid(value))
        .withMessage("Invalid User ID"),

    // validating name body field
    body("name")
        .optional()
        .isLength({ min: 3 })
        .withMessage("Name must be at least 3 characters long"),

    // validating email body field
    body("email")
        .optional()
        .isEmail()
        .withMessage("Email is invalid"),

    // validating password body field
    body("password")
        .optional()
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),

    // validating errors
    validateErrors
];

const deleteUserValidators = [
    // validating userId param
    param("userId")
        .notEmpty()
        .withMessage("User ID is required")
        .custom((value) => mongoose.Types.ObjectId.isValid(value))
        .withMessage("Invalid User ID"),

    // validating errors
    validateErrors
];

export { listUsersValidators, updateUserValidators, deleteUserValidators };
