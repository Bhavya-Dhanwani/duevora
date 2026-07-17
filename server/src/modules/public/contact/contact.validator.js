// Importing modules
import { body } from "express-validator";
import validateErrors from "../../../shared/utils/validateErrors.util.js";

const contactValidators = [

    body("name")
        .notEmpty().withMessage("Name is required")
        .isString().withMessage("Name must be a string")
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters"),

    body("email")
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Must be a valid email address")
        .normalizeEmail(),

    body("phone")
        .notEmpty().withMessage("Phone number is required")
        .isMobilePhone().withMessage("Must be a valid phone number"),

    body("subject")
        .notEmpty().withMessage("Subject is required")
        .isString().withMessage("Subject must be a string")
        .trim()
        .isLength({ min: 3, max: 150 }).withMessage("Subject must be between 3 and 150 characters"),

    body("message")
        .notEmpty().withMessage("Message is required")
        .isString().withMessage("Message must be a string")
        .trim()
        .isLength({ min: 10, max: 2000 }).withMessage("Message must be between 10 and 2000 characters"),

    validateErrors
];

export { contactValidators };
