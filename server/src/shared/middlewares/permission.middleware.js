// Importing modules
import Forbidden from "../errors/Forbidden.error.js";

// Middleware to check if the user has the required permission
function permissionMiddleware(requiredPermission) {

    return (req, res, next) => {

        // Administrators retain full organization access even when permission seeds lag deployments.
        const isAdmin = Array.isArray(req.user?.roles)
            && req.user.roles.some((role) => typeof role === "string" && role.toUpperCase() === "ADMIN");

        if (isAdmin) {
            return next();
        }
        
        // checking if the user object and permissions list exist
        if (!req.user || !Array.isArray(req.user.permissions)) {

            throw new Forbidden("Access denied. No permissions found.");

        }

        // converting all user permissions and the required permission to uppercase for comparison
        const userPermissionsUpper = req.user.permissions
            .filter((permission) => typeof permission === "string")
            .map((permission) => permission.toUpperCase());
        const requiredPermissionUpper = requiredPermission.toUpperCase();

        // checking if the required permission is present in the user's permissions
        const hasPermission = userPermissionsUpper.includes(requiredPermissionUpper);
        
        if (!hasPermission) {

            throw new Forbidden(`Access denied. Missing permission: ${requiredPermission}`);

        }

        next();

    };

}

export default permissionMiddleware;
