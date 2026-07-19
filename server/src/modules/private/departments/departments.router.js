// Importing modules
import express from "express";
import DepartmentsController from "./departments.controller.js";
import { createDepartmentValidators } from "./departments.validator.js";
import authMiddleware from "../../../shared/middlewares/auth.middleware.js";
import permissionMiddleware from "../../../shared/middlewares/permission.middleware.js";

// making the router
const router = express.Router();

// creating a Departments controller instance
const controller = new DepartmentsController();

/*
    @route POST /api/departments
    @desc Create a new department in the current organization
    @access Private (requires departments.create permission)
*/
router.post("/", authMiddleware, permissionMiddleware("departments.create"), createDepartmentValidators, controller.createDepartment);

/*
    @route GET /api/departments
    @desc Get all departments for the current organization
    @access Private (requires departments.view permission)
*/
router.get("/", authMiddleware, permissionMiddleware("departments.view"), controller.listDepartments);

// exporting the router
export default router;
