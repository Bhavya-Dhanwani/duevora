// Importing modules
import express from "express";
import CategoriesController from "./categories.controller.js";
import { createCategoryValidators } from "./categories.validator.js";
import authMiddleware from "../../../shared/middlewares/auth.middleware.js";
import permissionMiddleware from "../../../shared/middlewares/permission.middleware.js";

// making the router
const router = express.Router();

// creating a categories controller instance
const controller = new CategoriesController();

/*
    @route POST /api/categories
    @desc Create a new category in the current organization
    @access Private (requires categories.create permission)
*/
router.post("/", authMiddleware, permissionMiddleware("categories.create"), createCategoryValidators, controller.createCategory);

/*
    @route GET /api/categories
    @desc Get all categories for the current organization
    @access Private (requires categories.view permission)
*/
router.get("/", authMiddleware, permissionMiddleware("categories.view"), controller.listCategories);

// exporting the router
export default router;
