// Importing modules
import PurchaseOrderDao from "../../../shared/dao/purchaseOrder.dao.js";
import VendorDao from "../../../shared/dao/vendor.dao.js";

import Conflict from "../../../shared/errors/Conflict.error.js";
import NotFound from "../../../shared/errors/NotFound.error.js";

import Created from "../../../shared/responses/Created.response.js";

// class to handle purchase order operations
class PurchaseOrdersController {

    constructor() {

        // initializing the purchase order dao
        this.purchaseOrderDao = new PurchaseOrderDao();

        // initializing the vendor dao
        this.vendorDao = new VendorDao();

    }

    // create a new purchase order
    createPurchaseOrder = async (req, res) => {

        // extracting required fields from request body
        const { vendorId, poNumber, poDate, grandTotal, status } = req.body;
        const organizationId = req.user.organizationId;

        // validating referenced vendor exists in organization
        const vendor = await this.vendorDao.findOne({
            _id: vendorId,
            organizationId
        });

        if (!vendor) {

            throw new NotFound("Vendor reference not found in your organization.");

        }

        // verifying PO number is unique in organization context
        const existingPo = await this.purchaseOrderDao.findOne({
            organizationId,
            poNumber: poNumber.trim()
        });

        if (existingPo) {

            throw new Conflict("PO number already exists in your organization.");

        }

        // creating purchase order record using purchase order dao
        const po = await this.purchaseOrderDao.create({
            organizationId,
            vendorId,
            poNumber: poNumber.trim(),
            poDate: new Date(poDate),
            grandTotal,
            status: status || "draft"
        });

        // returning the created purchase order
        return Created(res, "Purchase order created successfully", po);

    }

    listPurchaseOrders = async (req, res) => {
        const organizationId = req.user.organizationId;
        const filter = { organizationId };
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const sortBy = req.query.sortBy || "createdAt";
        const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
        const total = await this.purchaseOrderDao.Model.countDocuments(filter);
        const items = await this.purchaseOrderDao.find(filter, { sort: { [sortBy]: sortOrder }, limit, skip });
        return res.status(200).json({ success: true, status: 200, message: "Purchase orders retrieved successfully", data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    }

}

export default PurchaseOrdersController;
