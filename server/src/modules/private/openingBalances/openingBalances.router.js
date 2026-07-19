// Importing modules
import express from "express";
import OpeningBalancesController from "./openingBalances.controller.js";
import { createOpeningBalanceValidators } from "./openingBalances.validator.js";
import authMiddleware from "../../../shared/middlewares/auth.middleware.js";
import permissionMiddleware from "../../../shared/middlewares/permission.middleware.js";

// making the router
const router = express.Router();

// creating a OpeningBalancesController instance
const controller = new OpeningBalancesController();

/*
    @route POST /api/opening-balances
    @desc Create a new opening balance entry for an account in a financial year
    @access Private (requires openingBalances.create permission)
*/
router.post("/", authMiddleware, permissionMiddleware("openingBalances.create"), createOpeningBalanceValidators, controller.createOpeningBalance);

router.get("/", authMiddleware, permissionMiddleware("openingBalances.view"), controller.listOpeningBalances);

// exporting the router
export default router;
