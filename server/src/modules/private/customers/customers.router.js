// Importing modules
import express from "express";
import CustomersController from "./customers.controller.js";
import { createCustomerValidators, listCustomersValidators, getCustomerValidators, updateCustomerValidators, bulkImportCustomerValidators, bulkDeleteCustomersValidators } from "./customers.validator.js";
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

/*
    @route GET /api/customers
    @desc List customer profiles with pagination and search
    @access Private (requires customers.view permission)
*/
router.get("/", authMiddleware, permissionMiddleware("customers.view"), listCustomersValidators, controller.listCustomers);

/*
    @route POST /api/customers/bulk-import
    @desc Bulk import customer profiles using transactions
    @access Private (requires customers.create permission)
*/
router.post("/bulk-import", authMiddleware, permissionMiddleware("customers.create"), bulkImportCustomerValidators, controller.bulkImportCustomers);

/*
    @route DELETE /api/customers/bulk-delete
    @desc Bulk soft delete customer profiles using transactions
    @access Private (requires customers.delete permission)
*/
router.delete("/bulk-delete", authMiddleware, permissionMiddleware("customers.delete"), bulkDeleteCustomersValidators, controller.bulkDeleteCustomers);

/*
    @route GET /api/customers/:customerId
    @desc Get customer details by ID
    @access Private (requires customers.view permission)
*/
router.get("/:customerId", authMiddleware, permissionMiddleware("customers.view"), getCustomerValidators, controller.getCustomerDetails);

/*
    @route PUT /api/customers/:customerId
    @desc Update customer profile details
    @access Private (requires customers.update permission)
*/
router.put("/:customerId", authMiddleware, permissionMiddleware("customers.update"), updateCustomerValidators, controller.updateCustomer);

/*
    @route DELETE /api/customers/:customerId
    @desc Soft delete a customer profile
    @access Private (requires customers.delete permission)
*/
router.delete("/:customerId", authMiddleware, permissionMiddleware("customers.delete"), getCustomerValidators, controller.deleteCustomer);

export default router;
