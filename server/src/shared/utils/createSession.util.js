// Importing modules 
import mongoose from "mongoose";

import { COOKIE_EXPIRY_TIME, REFRESH_TOKEN_COOKIE_OPTIONS } from "../constants/tokens.constants.js";
import { generateAccessToken, generateRefreshToken } from "./token.util.js";
import EmployeeDao from "../dao/employee.dao.js";
import EmployeeRoleDao from "../dao/employeeRole.dao.js";
import RolePermissionDao from "../dao/rolePermission.dao.js";
import EmployeePermissionDao from "../dao/employeePermission.dao.js";

// function to create a session and return sanitized user with tokens
async function createSession(user, res, sessionDao) {

    // resolving the employee organization and permission details
    const employeeDao = new EmployeeDao();
    const employee = await employeeDao.findOne({ userId: user._id });

    let employeeId = null;
    let organizationId = null;
    let roles = [];
    let permissions = [];

    if (employee) {

        employeeId = employee._id;
        organizationId = employee.organizationId._id || employee.organizationId;

        const employeeRoleDao = new EmployeeRoleDao();
        const employeeRoles = await employeeRoleDao.find({ employeeId: employee._id });

        const roleIds = [];
        for (const er of employeeRoles) {

            if (er.roleId) {

                roles.push(er.roleId.code);
                roleIds.push(er.roleId._id);

            }

        }

        const rolePermissionDao = new RolePermissionDao();
        const rolePermissions = await rolePermissionDao.find({ roleId: { $in: roleIds } });

        const permissionMap = new Map();
        for (const rp of rolePermissions) {

            if (rp.permissionId) {

                permissionMap.set(rp.permissionId.code, true);

            }

        }

        const employeePermissionDao = new EmployeePermissionDao();
        const employeePermissions = await employeePermissionDao.find({ employeeId: employee._id });

        for (const ep of employeePermissions) {

            if (ep.permissionId) {

                if (ep.type === "grant") {

                    permissionMap.set(ep.permissionId.code, true);

                } else if (ep.type === "deny") {

                    permissionMap.delete(ep.permissionId.code);

                }

            }

        }

        permissions = Array.from(permissionMap.keys());

    }

    // creating a session id
    const sessionId = new mongoose.Types.ObjectId();

    // making a refresh token using the session id and the user id
    const refreshToken = generateRefreshToken({
        sessionId: sessionId.toString(),
        userId: user._id.toString()
    });

    // creating a new session using the session dao
    await sessionDao.createSession({
        _id: sessionId,
        userId: user._id,
        refreshToken: refreshToken,
        expiresAt: new Date(Date.now() + COOKIE_EXPIRY_TIME)
    });

    // constructing the access token payload
    const tokenPayload = {
        _id: user._id,
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        ...(employee && {
            employeeId: employeeId.toString(),
            organizationId: organizationId.toString(),
            roles,
            permissions
        })
    };

    // making an access token using the payload
    const accessToken = generateAccessToken(tokenPayload);

    // setting refresh token in the cookie
    res.cookie("refreshToken", refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    return { sanitizedUser: tokenPayload, accessToken };

}

export default createSession;
