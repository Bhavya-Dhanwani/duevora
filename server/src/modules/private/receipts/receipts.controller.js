// Importing modules
import mongoose from "mongoose";
import ReceiptDao from "../../../shared/dao/receipt.dao.js";
import InvoiceDao from "../../../shared/dao/invoice.dao.js";
import CustomerDao from "../../../shared/dao/customer.dao.js";
import AccountDao from "../../../shared/dao/account.dao.js";
import JournalEntryDao from "../../../shared/dao/journalEntry.dao.js";
import JournalEntryLineDao from "../../../shared/dao/journalEntryLine.dao.js";
import LedgerEntryDao from "../../../shared/dao/ledgerEntry.dao.js";
import Conflict from "../../../shared/errors/Conflict.error.js";
import NotFound from "../../../shared/errors/NotFound.error.js";
import BadRequest from "../../../shared/errors/BadRequest.error.js";
import Created from "../../../shared/responses/Created.response.js";

// class to handle receipt operations
class ReceiptsController {

    constructor() {

        // initializing the daos
        this.receiptDao = new ReceiptDao();
        this.invoiceDao = new InvoiceDao();
        this.customerDao = new CustomerDao();
        this.accountDao = new AccountDao();
        this.journalEntryDao = new JournalEntryDao();
        this.journalEntryLineDao = new JournalEntryLineDao();
        this.ledgerEntryDao = new LedgerEntryDao();

    }

    // create a new receipt
    createReceipt = async (req, res) => {

        const { customerId, invoiceId, receiptNumber, receiptDate, amount, paymentMethod, accountId } = req.body;
        const organizationId = req.user.organizationId;

        // starting a mongodb transaction session
        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            // validating customer exists if provided
            if (customerId) {

                const customer = await this.customerDao.findOne({
                    _id: customerId,
                    organizationId
                }, session);

                if (!customer) {

                    throw new NotFound("Customer reference not found in your organization.");

                }

            }

            // validating invoice exists if provided
            let invoice = null;

            if (invoiceId) {

                invoice = await this.invoiceDao.findOne({
                    _id: invoiceId,
                    organizationId
                }, session);

                if (!invoice) {

                    throw new NotFound("Invoice reference not found in your organization.");

                }

            }

            // validating debit bank/cash account exists in organization context
            const bankAccount = await this.accountDao.findOne({
                _id: accountId,
                organizationId
            }, session);

            if (!bankAccount) {

                throw new NotFound("Bank/Cash account not found in your organization.");

            }

            // verifying receipt number is unique within organization context
            const existingReceipt = await this.receiptDao.findOne({
                organizationId,
                receiptNumber: {
                    $regex: new RegExp(`^${receiptNumber.trim()}$`, "i")
                }
            }, session);

            if (existingReceipt) {

                throw new Conflict("Receipt number already exists in your organization.");

            }

            // getting or creating Accounts Receivable credit account
            const arAccount = await this.getOrCreateAccount(
                organizationId,
                "Accounts Receivable",
                "ACCOUNTS_RECEIVABLE",
                "asset",
                session
            );

            // creating a journal entry
            const journalEntry = await this.journalEntryDao.create({
                organizationId,
                entryNumber: `JE-REC-${receiptNumber.trim()}-${Date.now()}`,
                date: new Date(receiptDate),
                narration: `Customer payment receipt ${receiptNumber.trim()}`,
                status: "posted"
            }, session);

            // creating journal entry lines and ledger entries
            // 1. Bank/Cash debit
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
                date: new Date(receiptDate),
                debit: amount,
                credit: 0
            }, session);

            // 2. Accounts Receivable credit
            await this.journalEntryLineDao.create({
                journalEntryId: journalEntry._id,
                accountId: arAccount._id,
                debit: 0,
                credit: amount
            }, session);

            await this.ledgerEntryDao.create({
                organizationId,
                accountId: arAccount._id,
                journalEntryId: journalEntry._id,
                date: new Date(receiptDate),
                debit: 0,
                credit: amount
            }, session);

            // creating receipt record using receipt dao
            const receipt = await this.receiptDao.create({
                organizationId,
                customerId: customerId || undefined,
                invoiceId: invoiceId || undefined,
                receiptNumber: receiptNumber.trim(),
                receiptDate: new Date(receiptDate),
                amount,
                paymentMethod,
                accountId
            }, session);

            // updating invoice status if linked
            if (invoice) {

                const existingReceipts = await this.receiptDao.find({ invoiceId: invoice._id }, {}, session);
                const totalPaid = existingReceipts.reduce((sum, r) => sum + r.amount, 0);

                if (totalPaid >= invoice.grandTotal) {

                    invoice.status = "paid";

                } else {

                    invoice.status = "partially_paid";

                }

                await invoice.save({ session });

            }

            // committing transaction
            await session.commitTransaction();

            return Created(res, "Receipt recorded successfully", receipt);

        } catch (error) {

            // aborting transaction on failure
            await session.abortTransaction();
            throw error;

        } finally {

            // ending the session
            session.endSession();

        }

    }

    // helper to get or create account
    getOrCreateAccount = async (organizationId, name, code, type, session) => {

        let account = await this.accountDao.Model.findOne({
            organizationId,
            code
        }).session(session);

        if (!account) {

            account = new this.accountDao.Model({
                organizationId,
                name,
                code,
                type,
                status: "active"
            });

            await account.save({ session });

        }

        return account;

    }

}

export default ReceiptsController;
