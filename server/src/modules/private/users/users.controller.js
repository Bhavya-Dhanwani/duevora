// Importing modules
import UserDao from "../../../shared/dao/user.dao.js";
import EmployeeDao from "../../../shared/dao/employee.dao.js";
import Conflict from "../../../shared/errors/Conflict.error.js";
import NotFound from "../../../shared/errors/NotFound.error.js";
import Ok from "../../../shared/responses/Ok.response.js";

// class to handle users operations
class UsersController {

    constructor() {

        // initializing the user dao
        this.userDao = new UserDao();

        // initializing the employee dao
        this.employeeDao = new EmployeeDao();

    }

    // list users with pagination and search
    listUsers = async (req, res) => {

        const organizationId = req.user.organizationId;

        // finding all employee records for the organization to extract user ids
        const employees = await this.employeeDao.find({ organizationId });
        const userIds = employees.map(emp => emp.userId?._id || emp.userId);

        // formulating user filter and excluding soft deleted users
        const filter = {
            _id: {
                $in: userIds
            },
            isDeleted: {
                $ne: true
            }
        };

        // checking if search query is provided
        if (req.query.search) {

            const searchRegex = {
                $regex: req.query.search,
                $options: "i"
            };

            filter.$or = [
                { name: searchRegex },
                { email: searchRegex }
            ];

        }

        // parsing pagination and sorting parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const sortBy = req.query.sortBy || "createdAt";
        const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;

        // counting total records matching filter using the underlying mongoose model
        const total = await this.userDao.UserModel.countDocuments(filter);

        // fetching users using user dao
        const users = await this.userDao.find(filter, {
            sort: { [sortBy]: sortOrder },
            limit,
            skip
        });

        // sanitizing users to remove sensitive fields
        const sanitizedUsers = users.map(user => ({
            _id: user._id,
            name: user.name,
            email: user.email,
            isVerified: user.isVerified
        }));

        // constructing pagination metadata
        const pages = Math.ceil(total / limit);
        
        return res.status(200).json({
            success: true,
            status: 200,
            message: "Users retrieved successfully",
            data: sanitizedUsers,
            pagination: {
                page,
                limit,
                total,
                pages
            }
        });

    }

    // update user details
    updateUser = async (req, res) => {

        const { userId } = req.params;
        const { name, email, password } = req.body;
        const organizationId = req.user.organizationId;

        // checking organization isolation: verify that the target userId belongs to the organization
        const employee = await this.employeeDao.findOne({ userId, organizationId });
        
        if (!employee) {

            throw new NotFound("User not found in your organization.");

        }

        // checking if email is being updated and if it is already in use by another user
        if (email) {

            const existingEmailUser = await this.userDao.findUserByEmail(email);

            if (existingEmailUser && existingEmailUser._id.toString() !== userId) {

                throw new Conflict("Email already in use.");

            }

        }

        // finding the user using the user dao
        const user = await this.userDao.findUserById(userId);

        if (!user || user.isDeleted) {

            throw new NotFound("User not found.");

        }

        // updating fields if provided
        if (name) {

            user.name = name;

        }

        if (email) {

            user.email = email;

            // updating the email in the employee record as well to keep them in sync
            employee.email = email;
            await employee.save();

        }

        if (password) {

            user.password = password;

        }

        // saving the updated user to trigger pre-save hashing hooks
        await user.save();

        // sanitizing the updated user object
        const sanitizedUser = {
            _id: user._id,
            name: user.name,
            email: user.email,
            isVerified: user.isVerified
        };

        return Ok(res, "User details updated successfully", sanitizedUser);

    }

    // soft delete user
    deleteUser = async (req, res) => {

        const { userId } = req.params;
        const organizationId = req.user.organizationId;

        // checking organization isolation: verify that the target userId belongs to the organization
        const employee = await this.employeeDao.findOne({ userId, organizationId });

        if (!employee) {

            throw new NotFound("User not found in your organization.");

        }

        // finding the user using the user dao
        const user = await this.userDao.findUserById(userId);

        if (!user || user.isDeleted) {

            throw new NotFound("User not found.");

        }

        // setting soft delete fields
        user.isDeleted = true;
        user.deletedAt = new Date();
        user.deletedBy = req.user._id;

        // saving the user to persist soft delete details
        await user.save();

        // deactivating their employee profile
        employee.status = "inactive";
        await employee.save();

        return Ok(res, "User soft deleted successfully");

    }

}

export default UsersController;
