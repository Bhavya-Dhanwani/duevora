// Importing modules
import mongoose from "mongoose";

import PaymentDao from "../../../shared/dao/payment.dao.js";
import PurchaseDao from "../../../shared/dao/purchase.dao.js";
import VendorDao from "../../../shared/dao/vendor.dao.js";
import AccountDao from "../../../shared/dao/account.dao.js";
import JournalEntryDao from "../../../shared/dao/journalEntry.dao.js";
import JournalEntryLineDao from "../../../shared/dao/journalEntryLine.dao.js";
import LedgerEntryDao from "../../../shared/dao/ledgerEntry.dao.js";

import Conflict from "../../../shared/errors/Conflict.error.js";
import NotFound from "../../../shared/errors/NotFound.error.js";
import BadRequest from "../../../shared/errors/BadRequest.error.js";

import Created from "../../../shared/responses/Created.response.js";

// class to handle payment operations
class PaymentsController {

    constructor() {

        // initializing the payment dao
        this.paymentDao = new PaymentDao();

        // initializing the purchase dao
        this.purchaseDao = new PurchaseDao();

        // initializing the vendor dao
        this.vendorDao = new VendorDao();

        // initializing the account dao
        this.accountDao = new AccountDao();

        // initializing the journal entry dao
        this.journalEntryDao = new JournalEntryDao();

        // initializing the journal entry line dao
        this.journalEntryLineDao = new JournalEntryLineDao();

        // initializing the ledger entry dao
        this.ledgerEntryDao = new LedgerEntryDao();

    }

    // create a new payment
    createPayment = async (req, res) => {

        // extracting required fields from request body
        const { vendorId, purchaseId, paymentNumber, paymentDate, amount, paymentMethod, accountId } = req.body;
        const organizationId = req.user.organizationId;

        // starting a mongodb transaction session
        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            // validating vendor exists if provided
            if (vendorId) {

                const vendor = await this.vendorDao.findOne({
                    _id: vendorId,
                    organizationId
                }, session);

                if (!vendor) {

                    throw new NotFound("Vendor reference not found in your organization.");

                }

            }

            // validating purchase exists if provided
            let purchase = null;

            if (purchaseId) {

                purchase = await this.purchaseDao.findOne({
                    _id: purchaseId,
                    organizationId
                }, session);

                if (!purchase) {

                    throw new NotFound("Purchase reference not found in your organization.");

                }

            }

            // validating credit bank/cash account exists in organization context
            const bankAccount = await this.accountDao.findOne({
                _id: accountId,
                organizationId
            }, session);

            if (!bankAccount) {

                throw new NotFound("Bank/Cash account not found in your organization.");

            }

            // verifying payment number is unique within organization context
            const existingPayment = await this.paymentDao.findOne({
                organizationId,
                paymentNumber: {
                    $regex: new RegExp(`^${paymentNumber.trim()}$`, "i")
                }
            }, session);

            if (existingPayment) {

                throw new Conflict("Payment number already exists in your organization.");

            }

            // getting or creating Accounts Payable debit account
            const apAccount = await this.getOrCreateAccount(
                organizationId,
                "Accounts Payable",
                "ACCOUNTS_PAYABLE",
                "liability",
                session
            );

            // creating a journal entry
            const journalEntry = await this.journalEntryDao.create({
                organizationId,
                entryNumber: `JE-PAY-${paymentNumber.trim()}-${Date.now()}`,
                date: new Date(paymentDate),
                narration: `Payment settlement ${paymentNumber.trim()}`,
                status: "posted"
            }, session);

            // creating journal entry lines and ledger entries
            // 1. Accounts Payable debit
            await this.journalEntryLineDao.create({
                journalEntryId: journalEntry._id,
                accountId: apAccount._id,
                debit: amount,
                credit: 0
            }, session);

            await this.ledgerEntryDao.create({
                organizationId,
                accountId: apAccount._id,
                journalEntryId: journalEntry._id,
                date: new Date(paymentDate),
                debit: amount,
                credit: 0
            }, session);

            // 2. Bank/Cash credit
            await this.journalEntryLineDao.create({
                journalEntryId: journalEntry._id,
                accountId: bankAccount._id,
                debit: 0,
                credit: amount
            }, session);

            await this.ledgerEntryDao.create({
                organizationId,
                accountId: bankAccount._id,
                journalEntryId: journalEntry._id,
                date: new Date(paymentDate),
                debit: 0,
                credit: amount
            }, session);

            // creating payment record using payment dao
            const payment = await this.paymentDao.create({
                organizationId,
                vendorId: vendorId || undefined,
                purchaseId: purchaseId || undefined,
                paymentNumber: paymentNumber.trim(),
                paymentDate: new Date(paymentDate),
                amount,
                paymentMethod,
                accountId
            }, session);

            // updating purchase status if linked
            if (purchase) {

                const existingPayments = await this.paymentDao.find({ purchaseId: purchase._id }, {}, session);
                const totalPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0);

                if (totalPaid >= purchase.grandTotal) {

                    purchase.status = "paid";

                } else {

                    purchase.status = "partially_paid";

                }

                await purchase.save({ session });

            }

            // committing transaction
            await session.commitTransaction();

            // returning the created payment
            return Created(res, "Payment settlement recorded successfully", payment);

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

        // searching for existing account by organization and code
        let account = await this.accountDao.Model.findOne({
            organizationId,
            code
        }).session(session);

        // creating the account if it does not exist
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

    listPayments = async (req, res) => {
        const organizationId = req.user.organizationId;
        const filter = { organizationId };
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const sortBy = req.query.sortBy || "createdAt";
        const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
        const total = await this.paymentDao.Model.countDocuments(filter);
        const items = await this.paymentDao.find(filter, { sort: { [sortBy]: sortOrder }, limit, skip });
        return res.status(200).json({ success: true, status: 200, message: "Payments retrieved successfully", data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    }

}

export default PaymentsController;
