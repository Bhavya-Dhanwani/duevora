// Importing modules
import { body } from "express-validator";
import mongoose from "mongoose";
import validateErrors from "../../../shared/utils/validateErrors.util.js";

const inviteValidators = [
    // validating email
    body("email")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Email is invalid"),

    // validating roleId
    body("roleId")
        .notEmpty()
        .withMessage("Role ID is required")
        .custom((value) => mongoose.Types.ObjectId.isValid(value))
        .withMessage("Invalid Role ID"),

    // validating errors
    validateErrors
];

export { inviteValidators };
