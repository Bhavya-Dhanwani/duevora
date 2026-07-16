// Importing modules
import { body, query, param } from "express-validator";
import validateErrors from "../../../shared/utils/validateErrors.util.js";
import mongoose from "mongoose";

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

const listCustomersValidators = [
    // validating page query param
    query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer"),

    // validating limit query param
    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be an integer between 1 and 100"),

    // validating sortBy query param
    query("sortBy")
        .optional()
        .isString()
        .withMessage("sortBy must be a string"),

    // validating sortOrder query param
    query("sortOrder")
        .optional()
        .isIn(["asc", "desc"])
        .withMessage("Sort order must be asc or desc"),

    // validating search query param
    query("search")
        .optional()
        .isString()
        .withMessage("Search term must be a string"),

    // validating errors
    validateErrors
];

const getCustomerValidators = [
    // validating customerId param
    param("customerId")
        .notEmpty()
        .withMessage("Customer ID is required")
        .custom((value) => mongoose.Types.ObjectId.isValid(value))
        .withMessage("Invalid Customer ID"),

    // validating errors
    validateErrors
];

const updateCustomerValidators = [
    // validating customerId param
    param("customerId")
        .notEmpty()
        .withMessage("Customer ID is required")
        .custom((value) => mongoose.Types.ObjectId.isValid(value))
        .withMessage("Invalid Customer ID"),

    // validating name field
    body("name")
        .optional()
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

const bulkImportCustomerValidators = [
    // validating customers array
    body("customers")
        .isArray({ min: 1 })
        .withMessage("Customers must be a non-empty array"),

    // validating name field inside array
    body("customers.*.name")
        .notEmpty()
        .withMessage("Customer name is required")
        .isLength({ min: 2 })
        .withMessage("Customer name must be at least 2 characters long"),

    // validating email field inside array
    body("customers.*.email")
        .optional()
        .isEmail()
        .withMessage("Email is invalid"),

    // validating phone field inside array
    body("customers.*.phone")
        .optional()
        .isString(),

    // validating address field inside array
    body("customers.*.address")
        .optional()
        .isString(),

    // validating taxNumber field inside array
    body("customers.*.taxNumber")
        .optional()
        .isString(),

    // validating errors
    validateErrors
];

const bulkDeleteCustomersValidators = [
    // validating customerIds array
    body("customerIds")
        .isArray({ min: 1 })
        .withMessage("customerIds must be a non-empty array"),

    // validating individual customerId inside array
    body("customerIds.*")
        .custom((value) => mongoose.Types.ObjectId.isValid(value))
        .withMessage("Invalid Customer ID"),

    // validating errors
    validateErrors
];

export { createCustomerValidators, listCustomersValidators, getCustomerValidators, updateCustomerValidators, bulkImportCustomerValidators, bulkDeleteCustomersValidators };
