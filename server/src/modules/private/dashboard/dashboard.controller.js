import mongoose from "mongoose";
import Invoice from "../../../shared/models/invoice.model.js";
import Receipt from "../../../shared/models/receipt.model.js";
import Reminder from "../../../shared/models/reminder.model.js";
import Ok from "../../../shared/responses/Ok.response.js";
import { roundMoney } from "../../../shared/utils/money.util.js";

const BILLED_INVOICE_STATUSES = ["sent", "partially_paid", "paid"];
const OVERDUE_INVOICE_STATUSES = ["sent", "partially_paid"];
const UPCOMING_REMINDER_STATUSES = ["scheduled", "queued"];
const SUMMARY_LIST_LIMIT = 5;

function normalizeCount(value) {
    const count = Number(value ?? 0);
    return Number.isFinite(count) && count > 0 ? Math.trunc(count) : 0;
}

function normalizeMoney(value) {
    const amount = Number(value ?? 0);

    if (!Number.isFinite(amount) || amount <= 0) {
        return 0;
    }

    return roundMoney(amount);
}

function customerSummary(customer) {
    return { name: customer?.name ?? null };
}

function invoiceSummary(invoice) {
    return { invoiceNumber: invoice?.invoiceNumber ?? null };
}

function buildInvoicePipeline(organizationId, now) {
    return [
        {
            $match: {
                organizationId,
                status: { $in: BILLED_INVOICE_STATUSES },
            },
        },
        {
            $lookup: {
                from: "receipts",
                let: { invoiceId: "$_id", organizationId: "$organizationId" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$invoiceId", "$$invoiceId"] },
                                    { $eq: ["$organizationId", "$$organizationId"] },
                                ],
                            },
                        },
                    },
                    { $group: { _id: null, totalPaid: { $sum: "$amount" } } },
                ],
                as: "receiptSummary",
            },
        },
        {
            $set: {
                amountPaid: {
                    $ifNull: [{ $arrayElemAt: ["$receiptSummary.totalPaid", 0] }, 0],
                },
            },
        },
        {
            $set: {
                outstanding: {
                    $max: [{ $subtract: ["$grandTotal", "$amountPaid"] }, 0],
                },
            },
        },
        {
            $facet: {
                metrics: [
                    {
                        $group: {
                            _id: null,
                            invoiceCount: { $sum: 1 },
                            paidInvoiceCount: {
                                $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] },
                            },
                            partiallyPaidInvoiceCount: {
                                $sum: { $cond: [{ $eq: ["$status", "partially_paid"] }, 1, 0] },
                            },
                            overdueInvoiceCount: {
                                $sum: {
                                    $cond: [
                                        {
                                            $and: [
                                                { $ne: ["$dueDate", null] },
                                                { $lt: ["$dueDate", now] },
                                                { $in: ["$status", OVERDUE_INVOICE_STATUSES] },
                                                { $gt: ["$outstanding", 0] },
                                            ],
                                        },
                                        1,
                                        0,
                                    ],
                                },
                            },
                            totalBilled: { $sum: "$grandTotal" },
                            totalOutstanding: { $sum: "$outstanding" },
                        },
                    },
                ],
                overdueInvoices: [
                    {
                        $match: {
                            dueDate: { $ne: null, $lt: now },
                            status: { $in: OVERDUE_INVOICE_STATUSES },
                            outstanding: { $gt: 0 },
                        },
                    },
                    { $sort: { dueDate: -1, createdAt: -1 } },
                    { $limit: SUMMARY_LIST_LIMIT },
                    {
                        $lookup: {
                            from: "customers",
                            let: { customerId: "$customerId", organizationId: "$organizationId" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ["$_id", "$$customerId"] },
                                                { $eq: ["$organizationId", "$$organizationId"] },
                                            ],
                                        },
                                    },
                                },
                                { $project: { _id: 0, name: 1 } },
                            ],
                            as: "customer",
                        },
                    },
                    { $set: { customer: { $arrayElemAt: ["$customer", 0] } } },
                    {
                        $project: {
                            _id: 0,
                            invoiceNumber: 1,
                            customer: { name: { $ifNull: ["$customer.name", null] } },
                            dueDate: 1,
                            outstanding: 1,
                        },
                    },
                ],
            },
        },
    ];
}

function buildReceiptPipeline(organizationId) {
    return [
        { $match: { organizationId } },
        {
            $facet: {
                metrics: [
                    { $group: { _id: null, totalCollected: { $sum: "$amount" } } },
                ],
                recentPayments: [
                    { $sort: { receiptDate: -1, createdAt: -1 } },
                    { $limit: SUMMARY_LIST_LIMIT },
                    {
                        $lookup: {
                            from: "customers",
                            let: { customerId: "$customerId", organizationId: "$organizationId" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ["$_id", "$$customerId"] },
                                                { $eq: ["$organizationId", "$$organizationId"] },
                                            ],
                                        },
                                    },
                                },
                                { $project: { _id: 0, name: 1 } },
                            ],
                            as: "customer",
                        },
                    },
                    {
                        $lookup: {
                            from: "invoices",
                            let: { invoiceId: "$invoiceId", organizationId: "$organizationId" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ["$_id", "$$invoiceId"] },
                                                { $eq: ["$organizationId", "$$organizationId"] },
                                            ],
                                        },
                                    },
                                },
                                { $project: { _id: 0, invoiceNumber: 1 } },
                            ],
                            as: "invoice",
                        },
                    },
                    {
                        $set: {
                            customer: { $arrayElemAt: ["$customer", 0] },
                            invoice: { $arrayElemAt: ["$invoice", 0] },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            receiptNumber: 1,
                            amount: 1,
                            date: "$receiptDate",
                            method: "$paymentMethod",
                            customer: { name: { $ifNull: ["$customer.name", null] } },
                            invoice: { invoiceNumber: { $ifNull: ["$invoice.invoiceNumber", null] } },
                        },
                    },
                ],
            },
        },
    ];
}

function buildReminderPipeline(organizationId, now) {
    return [
        { $match: { organizationId } },
        {
            $facet: {
                metrics: [
                    {
                        $group: {
                            _id: null,
                            scheduledReminderCount: {
                                $sum: {
                                    $cond: [{ $in: ["$status", UPCOMING_REMINDER_STATUSES] }, 1, 0],
                                },
                            },
                            failedReminderCount: {
                                $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
                            },
                        },
                    },
                ],
                upcomingReminders: [
                    {
                        $match: {
                            status: { $in: UPCOMING_REMINDER_STATUSES },
                            scheduledFor: { $gte: now },
                        },
                    },
                    { $sort: { scheduledFor: 1, createdAt: 1 } },
                    { $limit: SUMMARY_LIST_LIMIT },
                    {
                        $lookup: {
                            from: "customers",
                            let: { customerId: "$customerId", organizationId: "$organizationId" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ["$_id", "$$customerId"] },
                                                { $eq: ["$organizationId", "$$organizationId"] },
                                            ],
                                        },
                                    },
                                },
                                { $project: { _id: 0, name: 1 } },
                            ],
                            as: "customer",
                        },
                    },
                    {
                        $lookup: {
                            from: "invoices",
                            let: { invoiceId: "$invoiceId", organizationId: "$organizationId" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ["$_id", "$$invoiceId"] },
                                                { $eq: ["$organizationId", "$$organizationId"] },
                                            ],
                                        },
                                    },
                                },
                                { $project: { _id: 0, invoiceNumber: 1 } },
                            ],
                            as: "invoice",
                        },
                    },
                    {
                        $set: {
                            customer: { $arrayElemAt: ["$customer", 0] },
                            invoice: { $arrayElemAt: ["$invoice", 0] },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            title: 1,
                            scheduledFor: 1,
                            status: 1,
                            channels: 1,
                            customer: { name: { $ifNull: ["$customer.name", null] } },
                            invoice: { invoiceNumber: { $ifNull: ["$invoice.invoiceNumber", null] } },
                        },
                    },
                ],
            },
        },
    ];
}

class DashboardController {
    constructor(options = {}) {
        this.invoiceModel = options.invoiceModel ?? Invoice;
        this.receiptModel = options.receiptModel ?? Receipt;
        this.reminderModel = options.reminderModel ?? Reminder;
        this.now = options.now ?? (() => new Date());
    }

    summary = async (req, res) => {
        const organizationId = new mongoose.Types.ObjectId(req.user.organizationId);
        const now = this.now();

        // Independent aggregates avoid unbounded document hydration while keeping
        // receipt-backed totals current immediately after webhook processing.
        const [invoiceRows, receiptRows, reminderRows] = await Promise.all([
            this.invoiceModel.aggregate(buildInvoicePipeline(organizationId, now)),
            this.receiptModel.aggregate(buildReceiptPipeline(organizationId)),
            this.reminderModel.aggregate(buildReminderPipeline(organizationId, now)),
        ]);

        const invoiceResult = invoiceRows[0] ?? {};
        const receiptResult = receiptRows[0] ?? {};
        const reminderResult = reminderRows[0] ?? {};
        const invoiceMetrics = invoiceResult.metrics?.[0] ?? {};
        const receiptMetrics = receiptResult.metrics?.[0] ?? {};
        const reminderMetrics = reminderResult.metrics?.[0] ?? {};

        const recentPayments = (receiptResult.recentPayments ?? []).map((payment) => ({
            receiptNumber: payment.receiptNumber,
            amount: normalizeMoney(payment.amount),
            date: payment.date,
            method: payment.method,
            customer: customerSummary(payment.customer),
            invoice: invoiceSummary(payment.invoice),
        }));
        const upcomingReminders = (reminderResult.upcomingReminders ?? []).map((reminder) => ({
            title: reminder.title,
            scheduledFor: reminder.scheduledFor,
            status: reminder.status,
            channels: reminder.channels ?? [],
            customer: customerSummary(reminder.customer),
            invoice: invoiceSummary(reminder.invoice),
        }));
        const overdueInvoices = (invoiceResult.overdueInvoices ?? []).map((invoice) => ({
            invoiceNumber: invoice.invoiceNumber,
            customer: customerSummary(invoice.customer),
            dueDate: invoice.dueDate,
            outstanding: normalizeMoney(invoice.outstanding),
        }));

        return Ok(res, "Dashboard summary retrieved successfully", {
            invoiceCount: normalizeCount(invoiceMetrics.invoiceCount),
            paidInvoiceCount: normalizeCount(invoiceMetrics.paidInvoiceCount),
            partiallyPaidInvoiceCount: normalizeCount(invoiceMetrics.partiallyPaidInvoiceCount),
            overdueInvoiceCount: normalizeCount(invoiceMetrics.overdueInvoiceCount),
            totalBilled: normalizeMoney(invoiceMetrics.totalBilled),
            totalCollected: normalizeMoney(receiptMetrics.totalCollected),
            totalOutstanding: normalizeMoney(invoiceMetrics.totalOutstanding),
            scheduledReminderCount: normalizeCount(reminderMetrics.scheduledReminderCount),
            failedReminderCount: normalizeCount(reminderMetrics.failedReminderCount),
            recentPayments,
            upcomingReminders,
            overdueInvoices,
        });
    };
}

export {
    BILLED_INVOICE_STATUSES,
    OVERDUE_INVOICE_STATUSES,
    SUMMARY_LIST_LIMIT,
    UPCOMING_REMINDER_STATUSES,
    buildInvoicePipeline,
    buildReceiptPipeline,
    buildReminderPipeline,
};
export default DashboardController;
