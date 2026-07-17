// Importing modules 
import express from "express";
import authRouter from "./auth.router.js";
import organizationRouter from "../../modules/private/organization/organization.router.js";
import employeesRouter from "../../modules/private/employees/employees.router.js";
import usersRouter from "../../modules/private/users/users.router.js";
import departmentsRouter from "../../modules/private/departments/departments.router.js";
import rolesRouter from "../../modules/private/roles/roles.router.js";
import customersRouter from "../../modules/private/customers/customers.router.js";
import vendorsRouter from "../../modules/private/vendors/vendors.router.js";
import categoriesRouter from "../../modules/private/categories/categories.router.js";
import unitsRouter from "../../modules/private/units/units.router.js";

// making the router
const router = express.Router();

// mounting the public routers
router.use("/auth", authRouter);
router.use("/organization", organizationRouter);
router.use("/employees", employeesRouter);
router.use("/users", usersRouter);
router.use("/departments", departmentsRouter);
router.use("/roles", rolesRouter);
router.use("/customers", customersRouter);
router.use("/vendors", vendorsRouter);
router.use("/categories", categoriesRouter);
router.use("/units", unitsRouter);

// exporting the router
export default router;