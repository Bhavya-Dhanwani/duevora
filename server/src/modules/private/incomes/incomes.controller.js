// Importing modules
import mongoose from "mongoose";

import IncomeDao from "../../../shared/dao/income.dao.js";
import CategoryDao from "../../../shared/dao/category.dao.js";
import AccountDao from "../../../shared/dao/account.dao.js";
import JournalEntryDao from "../../../shared/dao/journalEntry.dao.js";
import JournalEntryLineDao from "../../../shared/dao/journalEntryLine.dao.js";
import LedgerEntryDao from "../../../shared/dao/ledgerEntry.dao.js";

import Conflict from "../../../shared/errors/Conflict.error.js";
import NotFound from "../../../shared/errors/NotFound.error.js";

import Created from "../../../shared/responses/Created.response.js";

// class to handle income operations
class IncomesController {

    constructor() {

        // initializing the income dao
        this.incomeDao = new IncomeDao();

        // initializing the category dao
        this.categoryDao = new CategoryDao();

        // initializing the account dao
        this.accountDao = new AccountDao();

        // initializing the journal entry dao
        this.journalEntryDao = new JournalEntryDao();

        // initializing the journal entry line dao
        this.journalEntryLineDao = new JournalEntryLineDao();

        // initializing the ledger entry dao
        this.ledgerEntryDao = new LedgerEntryDao();

    }

    // create a new income record
    createIncome = async (req, res) => {

        const { incomeNumber, date, amount, categoryId, accountId, description } = req.body;
        const organizationId = req.user.organizationId;

        // starting a mongodb transaction session
        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            // validating category exists in organization if provided
            if (categoryId) {

                const category = await this.categoryDao.findOne({ _id: categoryId, organizationId }, session);

                if (!category) {

                    throw new NotFound("Category reference not found in your organization.");

                }

            }

            // validating bank/cash account exists in organization context
            const bankAccount = await this.accountDao.findOne({ _id: accountId, organizationId }, session);

            if (!bankAccount) {

                throw new NotFound("Account reference not found in your organization.");

            }

            // verifying income number is unique within organization context
            const existing = await this.incomeDao.findOne({
                organizationId,
                incomeNumber: { $regex: new RegExp(`^${incomeNumber.trim()}$`, "i") }
            }, session);

            if (existing) {

                throw new Conflict("Income number already exists in your organization.");

            }

            // getting or creating income revenue account
            let revenueAccount = await this.accountDao.Model.findOne({ organizationId, code: "INCOME_REVENUE" }).session(session);

            if (!revenueAccount) {

                revenueAccount = new this.accountDao.Model({
                    organizationId,
                    name: "Income Revenue",
                    code: "INCOME_REVENUE",
                    type: "revenue",
                    status: "active"
                });

                await revenueAccount.save({ session });

            }

            // creating a journal entry
            const journalEntry = await this.journalEntryDao.create({
                organizationId,
                entryNumber: `JE-INC-${incomeNumber.trim()}-${Date.now()}`,
                date: new Date(date),
                narration: description || `Income record ${incomeNumber.trim()}`,
                status: "posted"
            }, session);

            // creating journal entry lines and ledger entries
            // 1. bank account debit
            await this.journalEntryLineDao.create({
                journalEntryId: journalEntry._id,
                accountId: bankAccount._id,
                debit: amount,
                credit: 0
            }, session);

            await this.ledgerEntryDao.create({
                organizationId,
                accountId: bankAccount._id,
                journalEntryId: journalEntry._id,
                date: new Date(date),
                debit: amount,
                credit: 0
            }, session);

            // 2. income revenue credit
            await this.journalEntryLineDao.create({
                journalEntryId: journalEntry._id,
                accountId: revenueAccount._id,
                debit: 0,
                credit: amount
            }, session);

            await this.ledgerEntryDao.create({
                organizationId,
                accountId: revenueAccount._id,
                journalEntryId: journalEntry._id,
                date: new Date(date),
                debit: 0,
                credit: amount
            }, session);

            // creating income record using income dao
            const income = await this.incomeDao.create({
                organizationId,
                incomeNumber: incomeNumber.trim(),
                date: new Date(date),
                amount,
                categoryId: categoryId || undefined,
                accountId,
                description
            }, session);

            // committing transaction
            await session.commitTransaction();

            // returning the created income
            return Created(res, "Income recorded successfully", income);

        } catch (error) {

            // aborting transaction on failure
            await session.abortTransaction();
            throw error;

        } finally {

            // ending the session
            session.endSession();

        }

    }

    listIncomes = async (req, res) => {
        const organizationId = req.user.organizationId;
        const filter = { organizationId };
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const sortBy = req.query.sortBy || "createdAt";
        const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
        const total = await this.incomeDao.Model.countDocuments(filter);
        const items = await this.incomeDao.find(filter, { sort: { [sortBy]: sortOrder }, limit, skip });
        return res.status(200).json({ success: true, status: 200, message: "Incomes retrieved successfully", data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    }

}

export default IncomesController;
