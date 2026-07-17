import { body } from "express-validator";
import validateErrors from "../../../shared/utils/validateErrors.util.js";

const upsertSettingValidators = [
    body("key").notEmpty().withMessage("Setting key is required").isString(),
    body("value").notEmpty().withMessage("Setting value is required").isString(),
    validateErrors
];

export { upsertSettingValidators };
