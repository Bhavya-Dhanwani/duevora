// Importing modules
import VoucherTypeDao from "../../../shared/dao/voucherType.dao.js";

import Conflict from "../../../shared/errors/Conflict.error.js";

import Created from "../../../shared/responses/Created.response.js";

// class to handle voucher type operations
class VoucherTypesController {

    constructor() {

        // initializing the voucher type dao
        this.voucherTypeDao = new VoucherTypeDao();

    }

    // create a new voucher type
    createVoucherType = async (req, res) => {

        const { name, code, description } = req.body;
        const organizationId = req.user.organizationId;

        // formatting code to uppercase
        const formattedCode = code.trim().toUpperCase();

        // verifying voucher type code is unique within organization context
        const existingVoucherType = await this.voucherTypeDao.findOne({
            organizationId,
            code: formattedCode
        });

        if (existingVoucherType) {

            throw new Conflict("Voucher type code already exists in your organization.");

        }

        // creating voucher type record using voucher type dao
        const voucherType = await this.voucherTypeDao.create({
            organizationId,
            name: name.trim(),
            code: formattedCode,
            description: description || ""
        });

        // returning the created voucher type
        return Created(res, "Voucher type created successfully", voucherType);

    }

    listVoucherTypes = async (req, res) => {
        const organizationId = req.user.organizationId;
        const filter = { organizationId };
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const sortBy = req.query.sortBy || "createdAt";
        const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
        const total = await this.voucherTypeDao.Model.countDocuments(filter);
        const items = await this.voucherTypeDao.find(filter, { sort: { [sortBy]: sortOrder }, limit, skip });
        return res.status(200).json({ success: true, status: 200, message: "Voucher types retrieved successfully", data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    }

}

export default VoucherTypesController;
