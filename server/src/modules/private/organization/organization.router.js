// Importing modules
import express from "express";
import OrganizationController from "./organization.controller.js";
import { onboardValidators } from "./organization.validator.js";
import authMiddleware from "../../../shared/middlewares/auth.middleware.js";
import permissionMiddleware from "../../../shared/middlewares/permission.middleware.js";

const router = express.Router();
const orgController = new OrganizationController();

/*
    @route POST /api/organization
    @desc Onboard a new organization
    @access Private (Authenticated User)
*/
router.post("/", authMiddleware, onboardValidators, orgController.onboard);

/*
    @route GET /api/organization
    @desc Get organization details
    @access Private (Authenticated and Authorized)
*/
router.get("/", authMiddleware, permissionMiddleware("organization.view"), orgController.getDetails);

export default router;
