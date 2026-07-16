// Importing modules
import express from "express";
import UsersController from "./users.controller.js";
import { listUsersValidators, updateUserValidators } from "./users.validator.js";
import authMiddleware from "../../../shared/middlewares/auth.middleware.js";
import permissionMiddleware from "../../../shared/middlewares/permission.middleware.js";

const router = express.Router();
const controller = new UsersController();

/*
    @route GET /api/users
    @desc Get paginated list of users in the current organization
    @access Private (requires users.view permission)
*/
router.get("/", authMiddleware, permissionMiddleware("users.view"), listUsersValidators, controller.listUsers);

/*
    @route PUT /api/users/:userId
    @desc Update user details in the current organization
    @access Private (requires users.update permission)
*/
router.put("/:userId", authMiddleware, permissionMiddleware("users.update"), updateUserValidators, controller.updateUser);

export default router;
