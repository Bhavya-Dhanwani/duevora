// Importing modules
import express from "express";
import VendorsController from "./vendors.controller.js";
import { createVendorValidators } from "./vendors.validator.js";
import authMiddleware from "../../../shared/middlewares/auth.middleware.js";
import permissionMiddleware from "../../../shared/middlewares/permission.middleware.js";

const router = express.Router();
const controller = new VendorsController();

/*
    @route POST /api/vendors
    @desc Create a new vendor profile in the current organization
    @access Private (requires vendors.create permission)
*/
router.post("/", authMiddleware, permissionMiddleware("vendors.create"), createVendorValidators, controller.createVendor);

export default router;
