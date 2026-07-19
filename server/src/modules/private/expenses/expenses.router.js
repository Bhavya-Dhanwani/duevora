// Importing modules
import express from "express";
import ExpensesController from "./expenses.controller.js";
import { createExpenseValidators } from "./expenses.validator.js";
import authMiddleware from "../../../shared/middlewares/auth.middleware.js";
import permissionMiddleware from "../../../shared/middlewares/permission.middleware.js";

// making the router
const router = express.Router();

// creating a expenses controller instance
const controller = new ExpensesController();

/*
    @route POST /api/expenses
    @desc Record a new expense
    @access Private (requires expenses.create permission)
*/
router.post("/", authMiddleware, permissionMiddleware("expenses.create"), createExpenseValidators, controller.createExpense);

router.get("/", authMiddleware, permissionMiddleware("expenses.view"), controller.listExpenses);

// exporting the router
export default router;
