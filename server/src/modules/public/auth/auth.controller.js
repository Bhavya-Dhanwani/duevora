// Importing modules
import UserDao from "../../../shared/dao/user.dao.js";
import SessionDao from "../../../shared/dao/session.dao.js";
import TokenDao from "../../../shared/dao/token.dao.js";
import EmployeeDao from "../../../shared/dao/employee.dao.js";
import EmployeeRoleDao from "../../../shared/dao/employeeRole.dao.js";

import { COOKIE_EXPIRY_TIME, REFRESH_TOKEN_COOKIE_OPTIONS, OTP_EXPIRY_TIME, RESET_PASSWORD_TOKEN_EXPIRY_TIME } from "../../../shared/constants/tokens.constants.js";

import { generateAccessToken, generateOTPToken, generateRefreshToken, generateResetPasswordToken } from "../../../shared/utils/token.util.js";
import sendMail from "../../../shared/utils/sendMail.util.js";
import { getGoogleAuthorizationUrl, getGoogleUserFromCode, verifyGoogleToken } from "../../../shared/utils/googleAuth.util.js";
import crypto from "crypto";
import createSession from "../../../shared/utils/createSession.util.js";

import sanitizeUser from "../../../shared/sanitizers/user.sanitizer.js";

import Unauthorized from "../../../shared/errors/Unauthorized.error.js";
import BadRequest from "../../../shared/errors/BadRequest.error.js";
import NotFound from "../../../shared/errors/NotFound.error.js";
import Conflict from "../../../shared/errors/Conflict.error.js";

import Created from "../../../shared/responses/Created.response.js";
import Ok from "../../../shared/responses/Ok.response.js";

import env from "../../../shared/config/env.config.js";

// class to handle public authentication operations
class AuthController {

    constructor() {

        // initializing the user dao
        this.userDao = new UserDao();

        // initializing the session dao
        this.sessionDao = new SessionDao();

        // initializing the token dao
        this.tokenDao = new TokenDao();

    }

    // signup a new user
    signup = async (req, res) => {

        // getting the user from the request body
        const { name, email, password, token } = req.body;

        let tokenDoc = null;
        if (token) {

            // finding the invitation token in the database
            tokenDoc = await this.tokenDao.findTokenByValue(token);

            if (!tokenDoc || tokenDoc.type !== "invitation") {

                throw new BadRequest("Invalid or expired invitation token.");

            }

            if (tokenDoc.email && tokenDoc.email !== email) {

                throw new BadRequest("Email does not match invitation.");

            }

        }

        // creating a new user using the user dao
        const user = await this.userDao.createUser({
            name,
            email,
            password,
            providers: ["local"],
            isVerified: token ? true : false
        });

        let employee = null;
        if (tokenDoc) {

            // initializing employee and employee role daos
            const employeeDao = new EmployeeDao();
            const employeeRoleDao = new EmployeeRoleDao();

            // finding existing employees to calculate the new code
            const existingEmployees = await employeeDao.find({ organizationId: tokenDoc.organizationId });
            const count = existingEmployees.length;

            // splitting full name into first and last name
            const nameParts = name.trim().split(/\s+/);
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(" ") || firstName;

            // creating employee profile using the employee dao
            employee = await employeeDao.create({
                userId: user._id,
                organizationId: tokenDoc.organizationId,
                employeeCode: `EMP-${count + 1}`,
                firstName,
                lastName,
                email: user.email,
                status: "active"
            });

            // assigning role to employee
            await employeeRoleDao.create({
                employeeId: employee._id,
                roleId: tokenDoc.roleId
            });

            // deleting the invitation token
            await this.tokenDao.deleteTokenByValue(token);

        }

        // creating session and tokens
        const { sanitizedUser, accessToken } = await createSession(user, res, this.sessionDao);

        if (!tokenDoc) {

            // generating the otp to verify the user email
            const otp = generateOTPToken();

            // setting otp in the database using the token dao
            await this.tokenDao.createToken({
                email: user.email,
                type: "otp",
                value: otp,
                expiresAt: new Date(Date.now() + OTP_EXPIRY_TIME)
            });

            sendMail(user.email, "Verify your email", `Your OTP is ${otp}. It will expire in ${OTP_EXPIRY_TIME / 60000} minutes.`);

            // returning otp verification response with access token
            return Created(res, "Otp Sent Successfully for verification", { user: sanitizedUser, accessToken: accessToken });

        }

        // returning the registered user with employee and access token
        return Created(res, "User registered successfully via invitation", { user: sanitizedUser, employee, accessToken: accessToken });

    }

    // login an existing user
    login = async (req, res) => {

        // getting the user from the request body
        const { email, password, token } = req.body;

        // finding the user using the user dao
        const user = await this.userDao.findUserByEmail(email);

        // checking if the user exists
        if (!user) {

            throw new NotFound("User not found");

        }

        // checking if the password is valid
        const isPasswordValid = await user.comparePassword(password);

        // if the password is not valid, throw an unauthorized error
        if (!isPasswordValid) {

            throw new Unauthorized("Invalid email or password");

        }

        let tokenDoc = null;
        if (token) {

            // finding the invitation token in the database
            tokenDoc = await this.tokenDao.findTokenByValue(token);

            if (!tokenDoc || tokenDoc.type !== "invitation") {

                throw new BadRequest("Invalid or expired invitation token.");

            }

            if (tokenDoc.email && tokenDoc.email.toLowerCase() !== email.toLowerCase()) {

                throw new BadRequest("Email does not match invitation.");

            }

        }

        if (tokenDoc) {

            const employeeDao = new EmployeeDao();
            const employeeRoleDao = new EmployeeRoleDao();

            // checking if user already has an employee profile for this organization
            let employee = await employeeDao.findOne({ userId: user._id, organizationId: tokenDoc.organizationId });

            if (!employee) {

                const existingEmployees = await employeeDao.find({ organizationId: tokenDoc.organizationId });
                const count = existingEmployees.length;

                const nameParts = user.name.trim().split(/\s+/);
                const firstName = nameParts[0];
                const lastName = nameParts.slice(1).join(" ") || firstName;

                employee = await employeeDao.create({
                    userId: user._id,
                    organizationId: tokenDoc.organizationId,
                    employeeCode: `EMP-${count + 1}`,
                    firstName,
                    lastName,
                    email: user.email,
                    status: "active"
                });

            }

            // assigning role to employee if not already assigned
            const existingRole = await employeeRoleDao.findOne({ employeeId: employee._id, roleId: tokenDoc.roleId });
            if (!existingRole) {

                await employeeRoleDao.create({
                    employeeId: employee._id,
                    roleId: tokenDoc.roleId
                });

            }

            // deleting the invitation token
            await this.tokenDao.deleteTokenByValue(token);

        }

        // creating session and tokens
        const { sanitizedUser, accessToken } = await createSession(user, res, this.sessionDao);

        // returning the logged in user with access token
        return Ok(res, "User Logged in Successfully", { user: sanitizedUser, accessToken: accessToken });

    }

    // login via google credential token
    googleLogin = async (req, res) => {

        // getting the credential from the request body
        const { credential } = req.body;

        // verifying the Google credential token
        const googleUser = await verifyGoogleToken(credential);

        // finding the user by email
        let user = await this.userDao.findUserByEmail(googleUser.email);

        if (user) {

            // checking if the user already has google provider
            if (!user.providers.includes("google")) {

                // adding google to the providers list and setting googleId
                user = await this.userDao.updateUserById(user._id, {
                    $addToSet: { providers: "google" },
                    googleId: googleUser.googleId
                });

            }

        } else {

            // creating a new user with google provider
            user = await this.userDao.createUser({
                name: googleUser.name,
                email: googleUser.email,
                providers: ["google"],
                googleId: googleUser.googleId,
                isVerified: true
            });

        }

        // creating session and tokens
        const { sanitizedUser, accessToken } = await createSession(user, res, this.sessionDao);

        // returning the google logged in user with access token
        return Ok(res, "User Logged in Successfully via Google", { user: sanitizedUser, accessToken: accessToken });

    }

    // redirect user to google oauth authorization page
    googleRedirect = (req, res) => {

        const state = crypto.randomUUID();

        // setting the google oauth state cookie
        res.cookie("googleOAuthState", state, {
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 10 * 60 * 1000,
        });

        // capturing client origin from referer or query
        let clientOrigin = env.FRONTEND_URL;
        if (req.headers.referer) {

            try {

                clientOrigin = new URL(req.headers.referer).origin;

            } catch (err) {

                // ignore invalid URL referers

            }

        }

        // setting the google oauth origin cookie
        res.cookie("googleOAuthOrigin", clientOrigin, {
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 10 * 60 * 1000,
        });

        // returning the redirect to google authorization url
        return res.redirect(getGoogleAuthorizationUrl(state));

    }

    // handle google oauth callback
    googleCallback = async (req, res) => {

        const { code, state, error } = req.query;
        const clientOrigin = req.cookies.googleOAuthOrigin || env.FRONTEND_URL;
        const redirectToLogin = `${clientOrigin}/login?googleError=1`;

        // redirecting to login if state is invalid or error
        const isStateValid = state && state === req.cookies.googleOAuthState;
        if (error || !code || !state || (!isStateValid && env.NODE_ENV === "production")) {

            if (error || !code || !state) {
                console.error(`[Google Auth] Callback failed. Error: ${error}, Code present: ${!!code}, State present: ${!!state}`);
            } else if (!isStateValid) {
                console.error(`[Google Auth] State mismatch. Received: ${state}, Expected (cookie): ${req.cookies.googleOAuthState}`);
            }

            res.clearCookie("googleOAuthState");
            res.clearCookie("googleOAuthOrigin");

            return res.redirect(redirectToLogin);

        }

        if (!isStateValid && env.NODE_ENV === "development") {
            console.warn(`[Google Auth] Warning: State mismatch detected in development mode. Received: ${state}, Expected (cookie): ${req.cookies.googleOAuthState}. Bypassing for easier local testing.`);
        }

        res.clearCookie("googleOAuthState");
        res.clearCookie("googleOAuthOrigin");

        // fetching the google user using the authorization code
        const googleUser = await getGoogleUserFromCode(code);
        let user = await this.userDao.findUserByEmail(googleUser.email);

        if (user && !user.providers.includes("google")) {

            // adding google provider to existing user
            user = await this.userDao.updateUserById(user._id, {
                $addToSet: { providers: "google" },
                googleId: googleUser.googleId,
                isVerified: true,
            });

        } else if (!user) {

            // creating a new user from google profile
            user = await this.userDao.createUser({
                name: googleUser.name,
                email: googleUser.email,
                providers: ["google"],
                googleId: googleUser.googleId,
                isVerified: true,
            });

        }

        // creating session for the authenticated user
        await createSession(user, res, this.sessionDao);

        // returning redirect to dashboard
        return res.redirect(`${clientOrigin}/dashboard`);

    }

    // send password reset email
    forgotPassword = async (req, res) => {

        // getting the email from the request body
        const { email } = req.body;

        // deleting any existing reset token for this email
        await this.tokenDao.deleteTokenByEmail(email, "reset");

        // generating the new reset token
        const resetToken = generateResetPasswordToken();

        // setting the reset token in the database
        await this.tokenDao.createToken({
            email: email,
            type: "reset",
            value: resetToken,
            expiresAt: new Date(Date.now() + RESET_PASSWORD_TOKEN_EXPIRY_TIME)
        });

        // sending the reset password token as a magic link to the email
        sendMail(email, "Your reset Password Link", `Click the link and reset your password <a href="${env.FRONTEND_URL}/reset-password/${resetToken}">Reset Your Password</a>`);

        // returning success response
        return Ok(res, "Reset password Mail sent Successfully");

    }

    // reset password using token
    resetPassword = async (req, res) => {

        // getting the token from the request body
        const { token, password } = req.body;

        // finding the reset token in the database
        const resetToken = await this.tokenDao.findTokenByValue(token);

        if (!resetToken) {

            throw new NotFound("Reset token not found.");

        }

        // finding the user from the email
        const user = await this.userDao.findUserByEmail(resetToken.email);

        // setting the new password
        user.password = password;

        // enabling local auth if the user was google-only
        if (!user.providers.includes("local")) {

            user.providers.push("local");

        }

        // saving the user with the new password
        await user.save();

        // deleting the token after successful reset
        await this.tokenDao.deleteTokenByValue(token);

        // returning success response
        return Ok(res, "Password reset Successfully");

    }

}

export default AuthController;
