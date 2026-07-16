// Importing modules
import Forbidden from "../errors/Forbidden.error.js";

// Middleware to check if the user has the required permission
function permissionMiddleware(requiredPermission) {

    return (req, res, next) => {
        
        // checking if the user object and permissions list exist
        if (!req.user || !Array.isArray(req.user.permissions)) {

            throw new Forbidden("Access denied. No permissions found.");

        }

        // converting all user permissions and the required permission to uppercase for comparison
        const userPermissionsUpper = req.user.permissions.map(p => p.toUpperCase());
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
