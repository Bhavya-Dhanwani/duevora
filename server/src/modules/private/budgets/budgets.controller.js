// Importing modules
import BudgetDao from "../../../shared/dao/budget.dao.js";
import FinancialYearDao from "../../../shared/dao/financialYear.dao.js";
import AccountDao from "../../../shared/dao/account.dao.js";

import Conflict from "../../../shared/errors/Conflict.error.js";
import NotFound from "../../../shared/errors/NotFound.error.js";

import Created from "../../../shared/responses/Created.response.js";

// class to handle budget operations
class BudgetsController {

    constructor() {

        // initializing the budget dao
        this.budgetDao = new BudgetDao();

        // initializing the financialYear dao
        this.financialYearDao = new FinancialYearDao();

        // initializing the account dao
        this.accountDao = new AccountDao();

    }

    // create a new budget
    createBudget = async (req, res) => {

        const { financialYearId, accountId, amount } = req.body;
        const organizationId = req.user.organizationId;

        // validating financial year exists in organization
        const financialYear = await this.financialYearDao.findOne({ _id: financialYearId, organizationId });

        if (!financialYear) {

            throw new NotFound("Financial year not found in your organization.");

        }

        // validating account reference exists in organization
        const account = await this.accountDao.findOne({ _id: accountId, organizationId });

        if (!account) {

            throw new NotFound("Account reference not found in your organization.");

        }

        // checking unique constraint per financialYear and account
        const existing = await this.budgetDao.findOne({ financialYearId, accountId });

        if (existing) {

            throw new Conflict("A budget already exists for this account in the specified financial year.");

        }

        // creating the budget record using budget dao
        const budget = await this.budgetDao.create({ organizationId, financialYearId, accountId, amount });

        // returning the created budget
        return Created(res, "Budget created successfully", budget);

    }

    listBudgets = async (req, res) => {
        const organizationId = req.user.organizationId;
        const filter = { organizationId };
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const sortBy = req.query.sortBy || "createdAt";
        const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
        const total = await this.budgetDao.Model.countDocuments(filter);
        const items = await this.budgetDao.find(filter, { sort: { [sortBy]: sortOrder }, limit, skip });
        return res.status(200).json({ success: true, status: 200, message: "Budgets retrieved successfully", data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    }

}

export default BudgetsController;
