// Importing modules
import CustomerDao from "../../../shared/dao/customer.dao.js";
import Conflict from "../../../shared/errors/Conflict.error.js";
import Created from "../../../shared/responses/Created.response.js";

// class to handle customer operations
class CustomersController {

    constructor() {

        // initializing the customer dao
        this.customerDao = new CustomerDao();

    }

    // create a new customer
    createCustomer = async (req, res) => {

        const { name, email, phone, address, taxNumber, status } = req.body;
        const organizationId = req.user.organizationId;

        // if email is provided, verifying that it is unique within the organization context
        if (email) {

            const existingCustomer = await this.customerDao.findOne({
                organizationId,
                email: email.toLowerCase()
            });

            if (existingCustomer) {

                throw new Conflict("Customer with this email already exists in your organization.");

            }

        }

        // creating the customer using the customer dao
        const customer = await this.customerDao.create({
            organizationId,
            name,
            email: email ? email.toLowerCase() : undefined,
            phone: phone || "",
            address: address || "",
            taxNumber: taxNumber || "",
            status: status || "active"
        });

        return Created(res, "Customer profile created successfully", customer);

    }

}

export default CustomersController;
