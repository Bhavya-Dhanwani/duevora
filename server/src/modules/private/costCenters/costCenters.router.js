// Importing modules
import express from "express";
import CostCentersController from "./costCenters.controller.js";
import { createCostCenterValidators } from "./costCenters.validator.js";
import authMiddleware from "../../../shared/middlewares/auth.middleware.js";
import permissionMiddleware from "../../../shared/middlewares/permission.middleware.js";

// making the router
const router = express.Router();

// creating a CostCenters controller instance
const controller = new CostCentersController();

/*
    @route POST /api/cost-centers
    @desc Create a new cost center in the current organization
    @access Private (requires costCenters.create permission)
*/
router.post("/", authMiddleware, permissionMiddleware("costCenters.create"), createCostCenterValidators, controller.createCostCenter);

router.get("/", authMiddleware, permissionMiddleware("costCenters.view"), controller.listCostCenters);

// exporting the router
export default router;
