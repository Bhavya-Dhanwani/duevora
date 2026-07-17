import express from "express";
import FinancialYearsController from "./financialYears.controller.js";
import { createFinancialYearValidators } from "./financialYears.validator.js";
import authMiddleware from "../../../shared/middlewares/auth.middleware.js";
import permissionMiddleware from "../../../shared/middlewares/permission.middleware.js";

const router = express.Router();
const controller = new FinancialYearsController();

router.post("/", authMiddleware, permissionMiddleware("financialYears.create"), createFinancialYearValidators, controller.createFinancialYear);

export default router;
