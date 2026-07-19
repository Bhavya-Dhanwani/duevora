// Importing modules
import DeliveryChallanDao from "../../../shared/dao/deliveryChallan.dao.js";
import CustomerDao from "../../../shared/dao/customer.dao.js";

import Conflict from "../../../shared/errors/Conflict.error.js";
import NotFound from "../../../shared/errors/NotFound.error.js";

import Created from "../../../shared/responses/Created.response.js";

// class to handle delivery challan operations
class DeliveryChallansController {

    constructor() {

        // initializing the delivery challan dao
        this.deliveryChallanDao = new DeliveryChallanDao();

        // initializing the customer dao
        this.customerDao = new CustomerDao();

    }

    // create a new delivery challan
    createDeliveryChallan = async (req, res) => {

        const { customerId, challanNumber, challanDate, status } = req.body;
        const organizationId = req.user.organizationId;

        // validating referenced customer exists in organization
        const customer = await this.customerDao.findOne({
            _id: customerId,
            organizationId
        });

        if (!customer) {

            throw new NotFound("Customer reference not found in your organization.");

        }

        // verifying challan number is unique in organization context
        const existingChallan = await this.deliveryChallanDao.findOne({
            organizationId,
            challanNumber: challanNumber.trim()
        });

        if (existingChallan) {

            throw new Conflict("Challan number already exists in your organization.");

        }

        // creating delivery challan record using delivery challan dao
        const challan = await this.deliveryChallanDao.create({
            organizationId,
            customerId,
            challanNumber: challanNumber.trim(),
            challanDate: new Date(challanDate),
            status: status || "draft"
        });

        // returning the created delivery challan
        return Created(res, "Delivery challan created successfully", challan);

    }

    listDeliveryChallans = async (req, res) => {
        const organizationId = req.user.organizationId;
        const filter = { organizationId };
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const sortBy = req.query.sortBy || "createdAt";
        const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
        const total = await this.deliveryChallanDao.Model.countDocuments(filter);
        const items = await this.deliveryChallanDao.find(filter, { sort: { [sortBy]: sortOrder }, limit, skip });
        return res.status(200).json({ success: true, status: 200, message: "Delivery challans retrieved successfully", data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    }

}

export default DeliveryChallansController;
