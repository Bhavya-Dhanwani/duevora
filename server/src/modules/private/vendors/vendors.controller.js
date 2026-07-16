// Importing modules
import VendorDao from "../../../shared/dao/vendor.dao.js";
import Conflict from "../../../shared/errors/Conflict.error.js";
import Created from "../../../shared/responses/Created.response.js";

// class to handle vendor operations
class VendorsController {

    constructor() {

        // initializing the vendor dao
        this.vendorDao = new VendorDao();

    }

    // create a new vendor
    createVendor = async (req, res) => {

        const { name, email, phone, address, taxNumber, status } = req.body;
        const organizationId = req.user.organizationId;

        // if email is provided, verifying that it is unique within the organization context
        if (email) {

            const existingVendor = await this.vendorDao.findOne({
                organizationId,
                email: email.toLowerCase(),
                isDeleted: {
                    $ne: true
                }
            });

            if (existingVendor) {

                throw new Conflict("Vendor with this email already exists in your organization.");

            }

        }

        // creating the vendor using the vendor dao
        const vendor = await this.vendorDao.create({
            organizationId,
            name,
            email: email ? email.toLowerCase() : undefined,
            phone: phone || "",
            address: address || "",
            taxNumber: taxNumber || "",
            status: status || "active",
            isDeleted: false
        });

        return Created(res, "Vendor profile created successfully", vendor);

    }

}

export default VendorsController;
