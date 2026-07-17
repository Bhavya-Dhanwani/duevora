import express from "express";
import IncomesController from "./incomes.controller.js";
import { createIncomeValidators } from "./incomes.validator.js";
import authMiddleware from "../../../shared/middlewares/auth.middleware.js";
import permissionMiddleware from "../../../shared/middlewares/permission.middleware.js";

const router = express.Router();
const controller = new IncomesController();

router.post("/", authMiddleware, permissionMiddleware("incomes.create"), createIncomeValidators, controller.createIncome);

export default router;
