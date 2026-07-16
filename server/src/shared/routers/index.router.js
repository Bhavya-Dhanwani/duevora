// Importing modules 
import express from "express";
import authRouter from "./auth.router.js";
import organizationRouter from "../../modules/private/organization/organization.router.js";
import employeesRouter from "../../modules/private/employees/employees.router.js";

// making the router
const router = express.Router();

// mounting the public routers
router.use("/auth", authRouter);
router.use("/organization", organizationRouter);
router.use("/employees", employeesRouter);

// exporting the router
export default router;