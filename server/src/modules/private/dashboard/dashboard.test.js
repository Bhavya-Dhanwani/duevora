import { jest } from "@jest/globals";
import mongoose from "mongoose";
import DashboardController, {
    BILLED_INVOICE_STATUSES,
    OVERDUE_INVOICE_STATUSES,
    SUMMARY_LIST_LIMIT,
    UPCOMING_REMINDER_STATUSES,
} from "./dashboard.controller.js";
import router from "./dashboard.router.js";
import apiRouter from "../../../shared/routers/index.router.js";

function createResponse() {
    const response = {
        status: jest.fn(),
        json: jest.fn(),
    };

    response.status.mockReturnValue(response);
    return response;
}

function findRouteHandlers(path) {
    const routeLayer = router.stack.find((layer) => layer.route?.path === path);
    return routeLayer.route.stack.map((layer) => layer.handle);
}

const organizationId = new mongoose.Types.ObjectId();
const fixedNow = new Date("2026-07-19T12:00:00.000Z");

let invoiceModel;
let receiptModel;
let reminderModel;
let controller;
let request;
let response;

beforeEach(() => {
    invoiceModel = { aggregate: jest.fn() };
    receiptModel = { aggregate: jest.fn() };
    reminderModel = { aggregate: jest.fn() };
    controller = new DashboardController({
        invoiceModel,
        receiptModel,
        reminderModel,
        now: () => fixedNow,
    });
    request = { user: { organizationId: organizationId.toString() } };
    response = createResponse();
});

describe("DashboardController.summary", () => {
    it("returns exact metrics and bounded seller summary shapes", async () => {
        invoiceModel.aggregate.mockResolvedValue([{
            metrics: [{
                invoiceCount: 3,
                paidInvoiceCount: 1,
                partiallyPaidInvoiceCount: 1,
                overdueInvoiceCount: 1,
                totalBilled: 3000.456,
                totalOutstanding: 850.125,
            }],
            overdueInvoices: [{
                invoiceNumber: "INV-OVERDUE",
                customer: { name: "Overdue Customer", email: "hidden@example.com" },
                dueDate: new Date("2026-07-01T00:00:00.000Z"),
                outstanding: 350.125,
                internalField: "not returned",
            }],
        }]);
        receiptModel.aggregate.mockResolvedValue([{
            metrics: [{ totalCollected: 2150.331 }],
            recentPayments: [{
                receiptNumber: "RZP-pay_123",
                amount: 649.999,
                date: new Date("2026-07-18T10:00:00.000Z"),
                method: "Razorpay",
                customer: { name: "Recent Customer", phone: "hidden" },
                invoice: { invoiceNumber: "INV-PAID", grandTotal: 1000 },
                providerPaymentId: "hidden-provider-id",
            }],
        }]);
        reminderModel.aggregate.mockResolvedValue([{
            metrics: [{ scheduledReminderCount: 2, failedReminderCount: 1 }],
            upcomingReminders: [{
                title: "Invoice due soon",
                scheduledFor: new Date("2026-07-20T09:00:00.000Z"),
                status: "queued",
                channels: ["email", "whatsapp"],
                customer: { name: "Upcoming Customer", email: "hidden@example.com" },
                invoice: { invoiceNumber: "INV-UPCOMING", grandTotal: 500 },
                lastError: "not returned",
            }],
        }]);

        await controller.summary(request, response);

        expect(response.status).toHaveBeenCalledWith(200);
        const body = response.json.mock.calls[0][0];
        expect(body.data).toEqual({
            invoiceCount: 3,
            paidInvoiceCount: 1,
            partiallyPaidInvoiceCount: 1,
            overdueInvoiceCount: 1,
            totalBilled: 3000.46,
            totalCollected: 2150.33,
            totalOutstanding: 850.13,
            scheduledReminderCount: 2,
            failedReminderCount: 1,
            recentPayments: [{
                receiptNumber: "RZP-pay_123",
                amount: 650,
                date: new Date("2026-07-18T10:00:00.000Z"),
                method: "Razorpay",
                customer: { name: "Recent Customer" },
                invoice: { invoiceNumber: "INV-PAID" },
            }],
            upcomingReminders: [{
                title: "Invoice due soon",
                scheduledFor: new Date("2026-07-20T09:00:00.000Z"),
                status: "queued",
                channels: ["email", "whatsapp"],
                customer: { name: "Upcoming Customer" },
                invoice: { invoiceNumber: "INV-UPCOMING" },
            }],
            overdueInvoices: [{
                invoiceNumber: "INV-OVERDUE",
                customer: { name: "Overdue Customer" },
                dueDate: new Date("2026-07-01T00:00:00.000Z"),
                outstanding: 350.13,
            }],
        });
    });

    it("returns stable zero values and empty lists when the organization has no data", async () => {
        invoiceModel.aggregate.mockResolvedValue([]);
        receiptModel.aggregate.mockResolvedValue([]);
        reminderModel.aggregate.mockResolvedValue([]);

        await controller.summary(request, response);

        expect(response.json.mock.calls[0][0].data).toEqual({
            invoiceCount: 0,
            paidInvoiceCount: 0,
            partiallyPaidInvoiceCount: 0,
            overdueInvoiceCount: 0,
            totalBilled: 0,
            totalCollected: 0,
            totalOutstanding: 0,
            scheduledReminderCount: 0,
            failedReminderCount: 0,
            recentPayments: [],
            upcomingReminders: [],
            overdueInvoices: [],
        });
    });

    it("scopes every aggregate and relationship lookup to the authenticated organization", async () => {
        invoiceModel.aggregate.mockResolvedValue([]);
        receiptModel.aggregate.mockResolvedValue([]);
        reminderModel.aggregate.mockResolvedValue([]);

        await controller.summary(request, response);

        for (const model of [invoiceModel, receiptModel, reminderModel]) {
            const pipeline = model.aggregate.mock.calls[0][0];
            expect(pipeline[0].$match.organizationId).toEqual(organizationId);

            const serializedPipeline = JSON.stringify(pipeline);
            expect(serializedPipeline).toContain("$$organizationId");
            expect(serializedPipeline).toContain("$organizationId");
        }
    });

    it("encodes billed, overdue, receipt, and upcoming-reminder rules in bounded pipelines", async () => {
        invoiceModel.aggregate.mockResolvedValue([]);
        receiptModel.aggregate.mockResolvedValue([]);
        reminderModel.aggregate.mockResolvedValue([]);

        await controller.summary(request, response);

        const invoicePipeline = invoiceModel.aggregate.mock.calls[0][0];
        const receiptPipeline = receiptModel.aggregate.mock.calls[0][0];
        const reminderPipeline = reminderModel.aggregate.mock.calls[0][0];
        const invoiceFacet = invoicePipeline.at(-1).$facet;
        const receiptFacet = receiptPipeline.at(-1).$facet;
        const reminderFacet = reminderPipeline.at(-1).$facet;
        const overdueMatch = invoiceFacet.overdueInvoices.find((stage) => stage.$match).$match;
        const upcomingMatch = reminderFacet.upcomingReminders.find((stage) => stage.$match).$match;

        expect(invoicePipeline[0].$match.status.$in).toEqual(BILLED_INVOICE_STATUSES);
        expect(BILLED_INVOICE_STATUSES).not.toContain("draft");
        expect(BILLED_INVOICE_STATUSES).not.toContain("void");
        expect(overdueMatch.status.$in).toEqual(OVERDUE_INVOICE_STATUSES);
        expect(OVERDUE_INVOICE_STATUSES).not.toContain("paid");
        expect(overdueMatch.dueDate.$lt).toBe(fixedNow);
        expect(overdueMatch.outstanding.$gt).toBe(0);
        expect(upcomingMatch.status.$in).toEqual(UPCOMING_REMINDER_STATUSES);
        expect(upcomingMatch.scheduledFor.$gte).toBe(fixedNow);
        expect(invoiceFacet.overdueInvoices).toContainEqual({ $limit: SUMMARY_LIST_LIMIT });
        expect(receiptFacet.recentPayments).toContainEqual({ $limit: SUMMARY_LIST_LIMIT });
        expect(reminderFacet.upcomingReminders).toContainEqual({ $limit: SUMMARY_LIST_LIMIT });
        expect(receiptFacet.metrics[0]).toEqual({
            $group: { _id: null, totalCollected: { $sum: "$amount" } },
        });
    });
});

describe("dashboard router access controls", () => {
    const [authenticate, authorize] = findRouteHandlers("/summary");

    it("requires authentication", () => {
        expect(() => authenticate({ headers: {} }, {}, jest.fn())).toThrow("User unauthenticated");
    });

    it("requires dashboard.view for non-admin users", () => {
        expect(() => authorize({ user: { roles: ["employee"], permissions: ["reports.view"] } }, {}, jest.fn()))
            .toThrow("dashboard.view");

        const next = jest.fn();
        authorize({ user: { roles: ["employee"], permissions: ["DASHBOARD.VIEW"] } }, {}, next);
        expect(next).toHaveBeenCalledTimes(1);
    });

    it("uses the shared case-insensitive ADMIN bypass", () => {
        const next = jest.fn();

        authorize({ user: { roles: ["admin"], permissions: [] } }, {}, next);

        expect(next).toHaveBeenCalledTimes(1);
    });

    it("is mounted at /api/dashboard by the central API router", () => {
        const mountLayer = apiRouter.stack.find((layer) => layer.handle === router);

        expect(mountLayer).toBeDefined();
        expect(mountLayer.matchers[0]("/dashboard/summary")).toEqual(
            expect.objectContaining({ path: "/dashboard" }),
        );
    });
});
