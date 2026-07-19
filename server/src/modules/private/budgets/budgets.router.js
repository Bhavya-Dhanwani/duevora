// Importing modules
import express from "express";
import BudgetsController from "./budgets.controller.js";
import { createBudgetValidators } from "./budgets.validator.js";
import authMiddleware from "../../../shared/middlewares/auth.middleware.js";
import permissionMiddleware from "../../../shared/middlewares/permission.middleware.js";

// making the router
const router = express.Router();

// creating a budgets controller instance
const controller = new BudgetsController();

/*
    @route POST /api/budgets
    @desc Create a new budget for an account in a financial year
    @access Private (requires budgets.create permission)
*/
router.post("/", authMiddleware, permissionMiddleware("budgets.create"), createBudgetValidators, controller.createBudget);

router.get("/", authMiddleware, permissionMiddleware("budgets.view"), controller.listBudgets);

// exporting the router
export default router;
