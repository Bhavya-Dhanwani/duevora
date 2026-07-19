// Importing modules
import mongoose from "mongoose";

import CurrencyDao from "../../../shared/dao/currency.dao.js";

import Conflict from "../../../shared/errors/Conflict.error.js";
import Created from "../../../shared/responses/Created.response.js";

// class to handle currency operations
class CurrenciesController {

    constructor() {

        // initializing the currency dao
        this.currencyDao = new CurrencyDao();

    }

    // create a new currency
    createCurrency = async (req, res) => {

        const { name, code, symbol, isBase } = req.body;
        const organizationId = req.user.organizationId;

        // starting a mongodb transaction session
        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            // verifying currency code is unique within the organization context
            const existingCurrency = await this.currencyDao.findOne({
                organizationId,
                code: code.toUpperCase()
            }, session);

            if (existingCurrency) {

                throw new Conflict("Currency code already exists in your organization.");

            }

            // if this currency is set as base, resetting all other currencies in this organization
            if (isBase === true) {

                await this.currencyDao.Model.updateMany(
                    { organizationId },
                    { isBase: false },
                    { session }
                );

            }

            // creating currency record using currency dao
            const currency = await this.currencyDao.create({
                organizationId,
                name,
                code: code.toUpperCase(),
                symbol,
                isBase: isBase || false
            }, session);

            // committing transaction
            await session.commitTransaction();

            // returning the created currency
            return Created(res, "Currency created successfully", currency);

        } catch (error) {

            // aborting transaction on failure
            await session.abortTransaction();
            throw error;

        } finally {

            // ending the session
            session.endSession();

        }

    }

    listCurrencies = async (req, res) => {
        const organizationId = req.user.organizationId;
        const filter = { organizationId };
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const sortBy = req.query.sortBy || "createdAt";
        const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
        const total = await this.currencyDao.Model.countDocuments(filter);
        const items = await this.currencyDao.find(filter, { sort: { [sortBy]: sortOrder }, limit, skip });
        return res.status(200).json({ success: true, status: 200, message: "Currencies retrieved successfully", data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    }

}

export default CurrenciesController;
