// Importing modules
import express from "express";
import IncomesController from "./incomes.controller.js";
import { createIncomeValidators } from "./incomes.validator.js";
import authMiddleware from "../../../shared/middlewares/auth.middleware.js";
import permissionMiddleware from "../../../shared/middlewares/permission.middleware.js";

// making the router
const router = express.Router();

// creating a incomes controller instance
const controller = new IncomesController();

/*
    @route POST /api/incomes
    @desc Record a new income
    @access Private (requires incomes.create permission)
*/
router.post("/", authMiddleware, permissionMiddleware("incomes.create"), createIncomeValidators, controller.createIncome);

router.get("/", authMiddleware, permissionMiddleware("incomes.view"), controller.listIncomes);

// exporting the router
export default router;
