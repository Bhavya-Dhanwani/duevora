// Importing modules
import express from "express";
import CustomersController from "./customers.controller.js";
import { createCustomerValidators } from "./customers.validator.js";
import authMiddleware from "../../../shared/middlewares/auth.middleware.js";
import permissionMiddleware from "../../../shared/middlewares/permission.middleware.js";

const router = express.Router();
const controller = new CustomersController();

/*
    @route POST /api/customers
    @desc Create a new customer profile in the current organization
    @access Private (requires customers.create permission)
*/
router.post("/", authMiddleware, permissionMiddleware("customers.create"), createCustomerValidators, controller.createCustomer);

export default router;
