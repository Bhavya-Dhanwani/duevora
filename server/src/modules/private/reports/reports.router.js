// Importing modules
import express from "express";
import ReportsController from "./reports.controller.js";
import authMiddleware from "../../../shared/middlewares/auth.middleware.js";
import permissionMiddleware from "../../../shared/middlewares/permission.middleware.js";

// making the router
const router = express.Router();

// creating a ReportsController instance
const controller = new ReportsController();

/*
    @route GET /api/reports/trial-balance
    @desc Retrieve the trial balance report for the organization
    @access Private (requires reports.view permission)
*/
router.get("/trial-balance", authMiddleware, permissionMiddleware("reports.view"), controller.trialBalance);

/*
    @route GET /api/reports/profit-loss
    @desc Retrieve the profit and loss report for the organization
    @access Private (requires reports.view permission)
*/
router.get("/profit-loss", authMiddleware, permissionMiddleware("reports.view"), controller.profitLoss);

/*
    @route GET /api/reports/balance-sheet
    @desc Retrieve the balance sheet report for the organization
    @access Private (requires reports.view permission)
*/
router.get("/balance-sheet", authMiddleware, permissionMiddleware("reports.view"), controller.balanceSheet);

/*
    @route GET /api/reports/cash-flow
    @desc Retrieve the cash flow report for the organization
    @access Private (requires reports.view permission)
*/
router.get("/cash-flow", authMiddleware, permissionMiddleware("reports.view"), controller.cashFlow);

/*
    @route GET /api/reports/ratios
    @desc Retrieve the business ratios report for the organization
    @access Private (requires reports.view permission)
*/
router.get("/ratios", authMiddleware, permissionMiddleware("reports.view"), controller.businessRatios);

// exporting the router
export default router;
