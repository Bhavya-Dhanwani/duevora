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

class IncomesController {

    constructor() {
        this.incomeDao = new IncomeDao();
        this.categoryDao = new CategoryDao();
        this.accountDao = new AccountDao();
        this.journalEntryDao = new JournalEntryDao();
        this.journalEntryLineDao = new JournalEntryLineDao();
        this.ledgerEntryDao = new LedgerEntryDao();
    }

    createIncome = async (req, res) => {
        const { incomeNumber, date, amount, categoryId, accountId, description } = req.body;
        const organizationId = req.user.organizationId;

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            if (categoryId) {
                const category = await this.categoryDao.findOne({ _id: categoryId, organizationId }, session);
                if (!category) throw new NotFound("Category reference not found in your organization.");
            }

            const bankAccount = await this.accountDao.findOne({ _id: accountId, organizationId }, session);
            if (!bankAccount) throw new NotFound("Account reference not found in your organization.");

            const existing = await this.incomeDao.findOne({
                organizationId,
                incomeNumber: { $regex: new RegExp(`^${incomeNumber.trim()}$`, "i") }
            }, session);
            if (existing) throw new Conflict("Income number already exists in your organization.");

            // get or create INCOME_REVENUE account
            let revenueAccount = await this.accountDao.Model.findOne({ organizationId, code: "INCOME_REVENUE" }).session(session);
            if (!revenueAccount) {
                revenueAccount = new this.accountDao.Model({ organizationId, name: "Income Revenue", code: "INCOME_REVENUE", type: "revenue", status: "active" });
                await revenueAccount.save({ session });
            }

            // journal entry: Debit bank account, Credit income revenue
            const journalEntry = await this.journalEntryDao.create({
                organizationId, entryNumber: `JE-INC-${incomeNumber.trim()}-${Date.now()}`,
                date: new Date(date), narration: description || `Income record ${incomeNumber.trim()}`, status: "posted"
            }, session);

            await this.journalEntryLineDao.create({ journalEntryId: journalEntry._id, accountId: bankAccount._id, debit: amount, credit: 0 }, session);
            await this.ledgerEntryDao.create({ organizationId, accountId: bankAccount._id, journalEntryId: journalEntry._id, date: new Date(date), debit: amount, credit: 0 }, session);
            await this.journalEntryLineDao.create({ journalEntryId: journalEntry._id, accountId: revenueAccount._id, debit: 0, credit: amount }, session);
            await this.ledgerEntryDao.create({ organizationId, accountId: revenueAccount._id, journalEntryId: journalEntry._id, date: new Date(date), debit: 0, credit: amount }, session);

            const income = await this.incomeDao.create({
                organizationId, incomeNumber: incomeNumber.trim(), date: new Date(date),
                amount, categoryId: categoryId || undefined, accountId, description
            }, session);

            await session.commitTransaction();
            return Created(res, "Income recorded successfully", income);

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

}

export default IncomesController;
