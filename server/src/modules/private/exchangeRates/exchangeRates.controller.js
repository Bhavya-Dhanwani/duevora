// Importing modules
import ExchangeRateDao from "../../../shared/dao/exchangeRate.dao.js";
import CurrencyDao from "../../../shared/dao/currency.dao.js";

import NotFound from "../../../shared/errors/NotFound.error.js";

import Created from "../../../shared/responses/Created.response.js";

// class to handle exchange rate operations
class ExchangeRatesController {

    constructor() {

        // initializing the exchange rate dao
        this.exchangeRateDao = new ExchangeRateDao();

        // initializing the currency dao
        this.currencyDao = new CurrencyDao();

    }

    // create a new exchange rate
    createExchangeRate = async (req, res) => {

        const { currencyId, rate, effectiveDate } = req.body;
        const organizationId = req.user.organizationId;

        // validating currency exists in organization
        const currency = await this.currencyDao.findOne({
            _id: currencyId,
            organizationId
        });

        if (!currency) {

            throw new NotFound("Currency reference not found in your organization.");

        }

        // creating exchange rate record using exchange rate dao
        const exchangeRate = await this.exchangeRateDao.create({
            organizationId,
            currencyId,
            rate,
            effectiveDate: new Date(effectiveDate)
        });

        // returning the created exchange rate
        return Created(res, "Exchange rate created successfully", exchangeRate);

    }

    listExchangeRates = async (req, res) => {
        const organizationId = req.user.organizationId;
        const filter = { organizationId };
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const sortBy = req.query.sortBy || "createdAt";
        const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
        const total = await this.exchangeRateDao.Model.countDocuments(filter);
        const items = await this.exchangeRateDao.find(filter, { sort: { [sortBy]: sortOrder }, limit, skip });
        return res.status(200).json({ success: true, status: 200, message: "Exchange rates retrieved successfully", data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    }

}

export default ExchangeRatesController;
