// Importing modules
import OpeningBalanceDao from "../../../shared/dao/openingBalance.dao.js";
import FinancialYearDao from "../../../shared/dao/financialYear.dao.js";
import AccountDao from "../../../shared/dao/account.dao.js";

import Conflict from "../../../shared/errors/Conflict.error.js";
import NotFound from "../../../shared/errors/NotFound.error.js";

import Created from "../../../shared/responses/Created.response.js";

// class to handle opening balances operations
class OpeningBalancesController {

    constructor() {

        // initializing the opening balance dao
        this.openingBalanceDao = new OpeningBalanceDao();

        // initializing the financial year dao
        this.financialYearDao = new FinancialYearDao();

        // initializing the account dao
        this.accountDao = new AccountDao();

    }

    // create a new opening balance entry
    createOpeningBalance = async (req, res) => {

        // extracting required fields from request body
        const { financialYearId, accountId, debit, credit } = req.body;
        const organizationId = req.user.organizationId;

        // validating that the referenced financial year exists in organization
        const financialYear = await this.financialYearDao.findOne({ _id: financialYearId, organizationId });

        if (!financialYear) {

            throw new NotFound("Financial year not found in your organization.");

        }

        // validating that the referenced account exists in organization
        const account = await this.accountDao.findOne({ _id: accountId, organizationId });

        if (!account) {

            throw new NotFound("Account reference not found in your organization.");

        }

        // checking unique constraint per financial year and account combination
        const existing = await this.openingBalanceDao.findOne({ financialYearId, accountId });

        if (existing) {

            throw new Conflict("An opening balance already exists for this account in the specified financial year.");

        }

        // creating opening balance record using opening balance dao
        const openingBalance = await this.openingBalanceDao.create({
            organizationId,
            financialYearId,
            accountId,
            debit: debit || 0,
            credit: credit || 0
        });

        // returning the created opening balance
        return Created(res, "Opening balance created successfully", openingBalance);

    }

    listOpeningBalances = async (req, res) => {
        const organizationId = req.user.organizationId;
        const filter = { organizationId };
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const sortBy = req.query.sortBy || "createdAt";
        const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
        const total = await this.openingBalanceDao.Model.countDocuments(filter);
        const items = await this.openingBalanceDao.find(filter, { sort: { [sortBy]: sortOrder }, limit, skip });
        return res.status(200).json({ success: true, status: 200, message: "Opening balances retrieved successfully", data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    }

}

export default OpeningBalancesController;
