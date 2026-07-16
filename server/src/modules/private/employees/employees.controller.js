// Importing modules
import crypto from "crypto";
import TokenDao from "../../../shared/dao/token.dao.js";
import RoleDao from "../../../shared/dao/role.dao.js";
import sendMail from "../../../shared/utils/sendMail.util.js";
import Created from "../../../shared/responses/Created.response.js";
import NotFound from "../../../shared/errors/NotFound.error.js";
import Forbidden from "../../../shared/errors/Forbidden.error.js";

// class to handle employee operations
class EmployeesController {

    constructor() {

        // initializing the token dao
        this.tokenDao = new TokenDao();

        // initializing the role dao
        this.roleDao = new RoleDao();

    }

    // invite a member by generating a 15-minute signup link
    inviteMember = async (req, res) => {

        const { email, roleId } = req.body;
        const organizationId = req.user.organizationId;

        if (!organizationId) {

            throw new Forbidden("User must belong to an organization to invite members.");

        }

        // verifying that the role exists and belongs to the organization using role dao
        const role = await this.roleDao.findOne({ _id: roleId, organizationId });
        
        if (!role) {

            throw new NotFound("Role not found in your organization.");

        }

        // generating secure 32-character invitation token
        const token = crypto.randomBytes(16).toString("hex");

        // deleting any existing invitation token for this email to avoid duplicates
        await this.tokenDao.deleteTokenByEmail(email, "invitation");

        // saving token in the database using token dao
        await this.tokenDao.createToken({
            email,
            type: "invitation",
            value: token,
            roleId,
            organizationId,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        });

        // constructing the invitation link
        const inviteUrl = `http://localhost:3000/signup?token=${token}`;

        // sending email notification
        sendMail(
            email,
            "Invitation to join Duevora ERP",
            `You have been invited to join the ERP Accounting System. Click the link to register (valid for 15 minutes): ${inviteUrl}`
        );

        return Created(res, "Invitation link generated successfully", {
            token,
            inviteUrl,
            email,
            expiresIn: "15 minutes"
        });

    }

}

export default EmployeesController;
