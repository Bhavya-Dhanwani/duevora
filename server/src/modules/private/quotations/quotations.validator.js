// Importing modules
import { param } from "express-validator";
import validateErrors from "../../../shared/utils/validateErrors.util.js";
import mongoose from "mongoose";

const approveQuotationValidators = [
    // validating quotationId param
    param("quotationId")
        .notEmpty()
        .withMessage("Quotation ID is required")
        .custom((value) => mongoose.Types.ObjectId.isValid(value))
        .withMessage("Invalid Quotation ID"),

    // validating errors
    validateErrors
];

export { approveQuotationValidators };
