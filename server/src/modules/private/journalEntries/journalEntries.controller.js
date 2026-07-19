// Importing modules
import mongoose from "mongoose";

import JournalEntryDao from "../../../shared/dao/journalEntry.dao.js";
import JournalEntryLineDao from "../../../shared/dao/journalEntryLine.dao.js";
import LedgerEntryDao from "../../../shared/dao/ledgerEntry.dao.js";
import AccountDao from "../../../shared/dao/account.dao.js";

import Conflict from "../../../shared/errors/Conflict.error.js";
import NotFound from "../../../shared/errors/NotFound.error.js";
import BadRequest from "../../../shared/errors/BadRequest.error.js";

import Created from "../../../shared/responses/Created.response.js";

// class to handle journal entry operations
class JournalEntriesController {

    constructor() {

        // initializing the journal entry dao
        this.journalEntryDao = new JournalEntryDao();

        // initializing the journal entry line dao
        this.journalEntryLineDao = new JournalEntryLineDao();

        // initializing the ledger entry dao
        this.ledgerEntryDao = new LedgerEntryDao();

        // initializing the account dao
        this.accountDao = new AccountDao();

    }

    // create a new manual journal entry
    createJournalEntry = async (req, res) => {

        const { entryNumber, date, narration, status, lines } = req.body;
        const organizationId = req.user.organizationId;

        // starting a mongodb transaction session
        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            // verifying entry number is unique within organization context
            const existingEntry = await this.journalEntryDao.findOne({
                organizationId,
                entryNumber: {
                    $regex: new RegExp(`^${entryNumber.trim()}$`, "i")
                }
            }, session);

            if (existingEntry) {

                throw new Conflict("Journal entry number already exists in your organization.");

            }

            // validating debits and credits balance
            let totalDebits = 0;
            let totalCredits = 0;

            const processedLines = [];

            for (const line of lines) {

                // validating account exists in organization
                const account = await this.accountDao.findOne({
                    _id: line.accountId,
                    organizationId
                }, session);

                if (!account) {

                    throw new NotFound(`Account with ID ${line.accountId} not found in your organization.`);

                }

                const debit = line.debit || 0;
                const credit = line.credit || 0;

                totalDebits += debit;
                totalCredits += credit;

                processedLines.push({
                    accountId: line.accountId,
                    debit,
                    credit
                });

            }

            // tolerance check for floating point math
            if (Math.abs(totalDebits - totalCredits) > 0.0001) {

                throw new BadRequest(`Journal entry does not balance. Total debits (${totalDebits}) must equal total credits (${totalCredits}).`);

            }

            // creating journal entry record using journal entry dao
            const entryStatus = status || "draft";
            const journalEntry = await this.journalEntryDao.create({
                organizationId,
                entryNumber: entryNumber.trim(),
                date: new Date(date),
                narration: narration || "",
                status: entryStatus
            }, session);

            // creating journal entry lines and ledger entries if posted
            for (const line of processedLines) {

                await this.journalEntryLineDao.create({
                    journalEntryId: journalEntry._id,
                    accountId: line.accountId,
                    debit: line.debit,
                    credit: line.credit
                }, session);

                if (entryStatus === "posted") {

                    await this.ledgerEntryDao.create({
                        organizationId,
                        accountId: line.accountId,
                        journalEntryId: journalEntry._id,
                        date: new Date(date),
                        debit: line.debit,
                        credit: line.credit
                    }, session);

                }

            }

            // committing transaction
            await session.commitTransaction();

            // returning the created journal entry
            return Created(res, "Journal entry recorded successfully", journalEntry);

        } catch (error) {

            // aborting transaction on failure
            await session.abortTransaction();
            throw error;

        } finally {

            // ending the session
            session.endSession();

        }

    }

    listJournalEntries = async (req, res) => {
        const organizationId = req.user.organizationId;
        const filter = { organizationId };
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const sortBy = req.query.sortBy || "createdAt";
        const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
        const total = await this.journalEntryDao.Model.countDocuments(filter);
        const items = await this.journalEntryDao.find(filter, { sort: { [sortBy]: sortOrder }, limit, skip });
        return res.status(200).json({ success: true, status: 200, message: "Journal entries retrieved successfully", data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    }

}

export default JournalEntriesController;
