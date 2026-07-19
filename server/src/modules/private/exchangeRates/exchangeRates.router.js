// Importing modules
import express from "express";
import ExchangeRatesController from "./exchangeRates.controller.js";
import { createExchangeRateValidators } from "./exchangeRates.validator.js";
import authMiddleware from "../../../shared/middlewares/auth.middleware.js";
import permissionMiddleware from "../../../shared/middlewares/permission.middleware.js";

// making the router
const router = express.Router();

// creating a exchange rates controller instance
const controller = new ExchangeRatesController();

/*
    @route POST /api/exchange-rates
    @desc Create a new exchange rate in the current organization
    @access Private (requires exchangeRates.create permission)
*/
router.post("/", authMiddleware, permissionMiddleware("exchangeRates.create"), createExchangeRateValidators, controller.createExchangeRate);

router.get("/", authMiddleware, permissionMiddleware("exchangeRates.view"), controller.listExchangeRates);

// exporting the router
export default router;
