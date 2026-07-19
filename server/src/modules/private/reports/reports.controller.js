// Importing modules
import mongoose from "mongoose";
import LedgerEntryDao from "../../../shared/dao/ledgerEntry.dao.js";
import AccountDao from "../../../shared/dao/account.dao.js";

import Ok from "../../../shared/responses/Ok.response.js";

// class to handle report operations
class ReportsController {

    constructor() {

        // initializing the ledger entry dao
        this.ledgerEntryDao = new LedgerEntryDao();

        // initializing the account dao
        this.accountDao = new AccountDao();

    }

    // retrieve trial balance report
    trialBalance = async (req, res) => {

        // extracting organization id from authenticated user
        const organizationId = new mongoose.Types.ObjectId(req.user.organizationId);

        // aggregating ledger entries by account to compute trial balance rows
        const rows = await this.ledgerEntryDao.Model.aggregate([
            { $match: { organizationId } },
            { $group: { _id: "$accountId", totalDebit: { $sum: "$debit" }, totalCredit: { $sum: "$credit" } } },
            { $lookup: { from: "accounts", localField: "_id", foreignField: "_id", as: "account" } },
            { $unwind: "$account" },
            { $project: { accountId: "$_id", accountName: "$account.name", accountCode: "$account.code", accountType: "$account.type", totalDebit: 1, totalCredit: 1, _id: 0 } },
            { $sort: { accountCode: 1 } }
        ]);

        // computing grand totals across all rows
        const grandTotalDebit = rows.reduce((s, r) => s + r.totalDebit, 0);
        const grandTotalCredit = rows.reduce((s, r) => s + r.totalCredit, 0);

        // returning the trial balance report
        return Ok(res, "Trial balance retrieved successfully", { rows, grandTotalDebit, grandTotalCredit });

    }

    // retrieve profit and loss report
    profitLoss = async (req, res) => {

        // extracting organization id from authenticated user
        const organizationId = new mongoose.Types.ObjectId(req.user.organizationId);
        const { startDate, endDate } = req.query;

        // building date filter from query params
        const dateFilter = {};

        if (startDate) {

            dateFilter.$gte = new Date(startDate);

        }

        if (endDate) {

            dateFilter.$lte = new Date(endDate);

        }

        // building match stage with optional date range
        const matchStage = { organizationId };

        if (startDate || endDate) {

            matchStage.date = dateFilter;

        }

        // aggregating revenue and expense accounts for the period
        const rows = await this.ledgerEntryDao.Model.aggregate([
            { $match: matchStage },
            { $lookup: { from: "accounts", localField: "accountId", foreignField: "_id", as: "account" } },
            { $unwind: "$account" },
            { $match: { "account.type": { $in: ["revenue", "expense"] } } },
            { $group: { _id: { accountId: "$accountId", type: "$account.type", name: "$account.name", code: "$account.code" }, totalDebit: { $sum: "$debit" }, totalCredit: { $sum: "$credit" } } },
            { $project: { accountId: "$_id.accountId", name: "$_id.name", code: "$_id.code", type: "$_id.type", totalDebit: 1, totalCredit: 1, _id: 0 } }
        ]);

        // computing revenue, expenses, and net profit
        const revenue = rows.filter(r => r.type === "revenue").reduce((s, r) => s + (r.totalCredit - r.totalDebit), 0);
        const expenses = rows.filter(r => r.type === "expense").reduce((s, r) => s + (r.totalDebit - r.totalCredit), 0);
        const netProfit = revenue - expenses;

        // returning the profit and loss report
        return Ok(res, "Profit & Loss retrieved successfully", { rows, revenue, expenses, netProfit });

    }

    // retrieve balance sheet report
    balanceSheet = async (req, res) => {

        // extracting organization id from authenticated user
        const organizationId = new mongoose.Types.ObjectId(req.user.organizationId);

        // aggregating asset, liability, and equity accounts for balance sheet
        const rows = await this.ledgerEntryDao.Model.aggregate([
            { $match: { organizationId } },
            { $group: { _id: "$accountId", totalDebit: { $sum: "$debit" }, totalCredit: { $sum: "$credit" } } },
            { $lookup: { from: "accounts", localField: "_id", foreignField: "_id", as: "account" } },
            { $unwind: "$account" },
            { $match: { "account.type": { $in: ["asset", "liability", "equity"] } } },
            { $project: { accountId: "$_id", name: "$account.name", code: "$account.code", type: "$account.type", balance: { $subtract: ["$totalDebit", "$totalCredit"] }, _id: 0 } }
        ]);

        // calculating current period Net Profit to correctly balance the Balance Sheet
        const plRows = await this.ledgerEntryDao.Model.aggregate([
            { $match: { organizationId } },
            { $lookup: { from: "accounts", localField: "accountId", foreignField: "_id", as: "account" } },
            { $unwind: "$account" },
            { $match: { "account.type": { $in: ["revenue", "expense"] } } },
            { $group: { _id: "$account.type", totalDebit: { $sum: "$debit" }, totalCredit: { $sum: "$credit" } } }
        ]);

        const revenue = plRows.filter(r => r._id === "revenue").reduce((s, r) => s + (r.totalCredit - r.totalDebit), 0);
        const expenses = plRows.filter(r => r._id === "expense").reduce((s, r) => s + (r.totalDebit - r.totalCredit), 0);
        const netProfit = revenue - expenses;

        // computing section totals for balance sheet
        const assets = rows.filter(r => r.type === "asset").reduce((s, r) => s + r.balance, 0);
        const liabilities = rows.filter(r => r.type === "liability").reduce((s, r) => s + Math.abs(r.balance), 0);
        const equityOriginal = rows.filter(r => r.type === "equity").reduce((s, r) => s + Math.abs(r.balance), 0);
        
        // adding Net Profit / Retained Earnings to the equity section so Assets = Liabilities + Equity
        const equity = equityOriginal + netProfit;

        // returning the balance sheet report
        return Ok(res, "Balance sheet retrieved successfully", { rows, assets, liabilities, equity, netProfit });

    }

    // retrieve business ratios report
    businessRatios = async (req, res) => {

        const organizationId = new mongoose.Types.ObjectId(req.user.organizationId);

        // aggregating account balances for ratios
        const rows = await this.ledgerEntryDao.Model.aggregate([
            { $match: { organizationId } },
            { $group: { _id: "$accountId", totalDebit: { $sum: "$debit" }, totalCredit: { $sum: "$credit" } } },
            { $lookup: { from: "accounts", localField: "_id", foreignField: "_id", as: "account" } },
            { $unwind: "$account" },
            { $project: { accountId: "$_id", name: "$account.name", code: "$account.code", type: "$account.type", balance: { $subtract: ["$totalDebit", "$totalCredit"] }, _id: 0 } }
        ]);

        // calculating current period Net Profit
        const plRows = await this.ledgerEntryDao.Model.aggregate([
            { $match: { organizationId } },
            { $lookup: { from: "accounts", localField: "accountId", foreignField: "_id", as: "account" } },
            { $unwind: "$account" },
            { $match: { "account.type": { $in: ["revenue", "expense"] } } },
            { $group: { _id: "$account.type", totalDebit: { $sum: "$debit" }, totalCredit: { $sum: "$credit" } } }
        ]);

        const revenue = plRows.filter(r => r._id === "revenue").reduce((s, r) => s + (r.totalCredit - r.totalDebit), 0);
        const expenses = plRows.filter(r => r._id === "expense").reduce((s, r) => s + (r.totalDebit - r.totalCredit), 0);
        const netProfit = revenue - expenses;

        const assets = rows.filter(r => r.type === "asset").reduce((s, r) => s + r.balance, 0);
        const liabilities = rows.filter(r => r.type === "liability").reduce((s, r) => s + Math.abs(r.balance), 0);
        const equityOriginal = rows.filter(r => r.type === "equity").reduce((s, r) => s + Math.abs(r.balance), 0);
        const equity = equityOriginal + netProfit;

        // Quick Assets: Cash, Bank, and Receivables (Assets excluding Inventory)
        const quickAssets = rows
            .filter(r => r.type === "asset" && !r.code.toUpperCase().includes("INVENTORY") && !r.name.toUpperCase().includes("INVENTORY"))
            .reduce((s, r) => s + r.balance, 0);

        // Direct Costs/COGS/Purchases
        const directCosts = rows
            .filter(r => r.type === "expense" && (r.code.toUpperCase().includes("PURCH") || r.code.toUpperCase().includes("COGS") || r.name.toUpperCase().includes("DIRECT")))
            .reduce((s, r) => s + r.balance, 0);
        const grossProfit = revenue - directCosts;

        // Computing business ratios
        const currentRatio = liabilities > 0 ? Number((assets / liabilities).toFixed(2)) : assets > 0 ? 99.9 : 0;
        const quickRatio = liabilities > 0 ? Number((quickAssets / liabilities).toFixed(2)) : quickAssets > 0 ? 99.9 : 0;
        const grossProfitMargin = revenue > 0 ? Number(((grossProfit / revenue) * 100).toFixed(2)) : 0;
        const netProfitMargin = revenue > 0 ? Number(((netProfit / revenue) * 100).toFixed(2)) : 0;
        const debtToEquity = equity > 0 ? Number((liabilities / equity).toFixed(2)) : liabilities > 0 ? 99.9 : 0;

        return Ok(res, "Business ratios retrieved successfully", {
            currentRatio,
            quickRatio,
            grossProfitMargin,
            netProfitMargin,
            debtToEquity,
            assets,
            liabilities,
            equity,
            revenue,
            netProfit,
            grossProfit,
            directCosts
        });

    }

    // retrieve cash flow report
    cashFlow = async (req, res) => {

        // extracting organization id from authenticated user
        const organizationId = new mongoose.Types.ObjectId(req.user.organizationId);
        const { startDate, endDate } = req.query;

        // building date filter from query params
        const dateFilter = {};

        if (startDate) {

            dateFilter.$gte = new Date(startDate);

        }

        if (endDate) {

            dateFilter.$lte = new Date(endDate);

        }

        // building match stage with optional date range
        const matchStage = { organizationId };

        if (startDate || endDate) {

            matchStage.date = dateFilter;

        }

        // aggregating cash inflows and outflows from asset accounts
        const rows = await this.ledgerEntryDao.Model.aggregate([
            { $match: matchStage },
            { $lookup: { from: "accounts", localField: "accountId", foreignField: "_id", as: "account" } },
            { $unwind: "$account" },
            { $match: { "account.type": "asset" } },
            { $group: { _id: null, totalInflow: { $sum: "$debit" }, totalOutflow: { $sum: "$credit" } } },
            { $project: { totalInflow: 1, totalOutflow: 1, netCashFlow: { $subtract: ["$totalInflow", "$totalOutflow"] }, _id: 0 } }
        ]);

        // returning the cash flow report
        return Ok(res, "Cash flow retrieved successfully", rows[0] || { totalInflow: 0, totalOutflow: 0, netCashFlow: 0 });

    }

}

export default ReportsController;
