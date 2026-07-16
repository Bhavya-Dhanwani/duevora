// Importing modules
import express from "express";
import VendorsController from "./vendors.controller.js";
import {
    createVendorValidators,
    listVendorsValidators,
    getVendorValidators,
    updateVendorValidators,
    bulkImportVendorsValidators,
    bulkUpdateVendorsValidators
} from "./vendors.validator.js";
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

/*
    @route GET /api/vendors
    @desc List vendor profiles with pagination and search
    @access Private (requires vendors.view permission)
*/
router.get("/", authMiddleware, permissionMiddleware("vendors.view"), listVendorsValidators, controller.listVendors);

/*
    @route POST /api/vendors/bulk-import
    @desc Bulk import vendor profiles using transactions
    @access Private (requires vendors.create permission)
*/
router.post("/bulk-import", authMiddleware, permissionMiddleware("vendors.create"), bulkImportVendorsValidators, controller.bulkImportVendors);

/*
    @route PATCH /api/vendors/bulk-update
    @desc Bulk update vendor profiles using transactions
    @access Private (requires vendors.update permission)
*/
router.patch("/bulk-update", authMiddleware, permissionMiddleware("vendors.update"), bulkUpdateVendorsValidators, controller.bulkUpdateVendors);

/*
    @route GET /api/vendors/:vendorId
    @desc Get vendor details by ID
    @access Private (requires vendors.view permission)
*/
router.get("/:vendorId", authMiddleware, permissionMiddleware("vendors.view"), getVendorValidators, controller.getVendorDetails);

/*
    @route PUT /api/vendors/:vendorId
    @desc Update vendor profile details
    @access Private (requires vendors.update permission)
*/
router.put("/:vendorId", authMiddleware, permissionMiddleware("vendors.update"), updateVendorValidators, controller.updateVendor);

/*
    @route DELETE /api/vendors/:vendorId
    @desc Soft delete a vendor profile
    @access Private (requires vendors.delete permission)
*/
router.delete("/:vendorId", authMiddleware, permissionMiddleware("vendors.delete"), getVendorValidators, controller.deleteVendor);

export default router;
