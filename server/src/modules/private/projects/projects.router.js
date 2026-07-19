// Importing modules
import express from "express";
import ProjectsController from "./projects.controller.js";
import { createProjectValidators } from "./projects.validator.js";
import authMiddleware from "../../../shared/middlewares/auth.middleware.js";
import permissionMiddleware from "../../../shared/middlewares/permission.middleware.js";

// making the router
const router = express.Router();

// creating a ProjectsController instance
const controller = new ProjectsController();

/*
    @route POST /api/projects
    @desc Create a new project in the current organization
    @access Private (requires projects.create permission)
*/
router.post("/", authMiddleware, permissionMiddleware("projects.create"), createProjectValidators, controller.createProject);

router.get("/", authMiddleware, permissionMiddleware("projects.view"), controller.listProjects);

// exporting the router
export default router;
