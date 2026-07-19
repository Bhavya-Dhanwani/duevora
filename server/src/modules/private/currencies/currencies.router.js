// Importing modules
import express from "express";
import CurrenciesController from "./currencies.controller.js";
import { createCurrencyValidators } from "./currencies.validator.js";
import authMiddleware from "../../../shared/middlewares/auth.middleware.js";
import permissionMiddleware from "../../../shared/middlewares/permission.middleware.js";

// making the router
const router = express.Router();

// creating a Currencies controller instance
const controller = new CurrenciesController();

/*
    @route POST /api/currencies
    @desc Create a new currency in the current organization
    @access Private (requires currencies.create permission)
*/
router.post("/", authMiddleware, permissionMiddleware("currencies.create"), createCurrencyValidators, controller.createCurrency);

router.get("/", authMiddleware, permissionMiddleware("currencies.view"), controller.listCurrencies);

// exporting the router
export default router;
