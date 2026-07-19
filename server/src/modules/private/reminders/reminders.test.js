import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

process.env.WHATSAPP_MODE = "deeplink";
process.env.SEND_MAIL = "false";

const mockCreatePaymentLink = jest.fn();
const mockCancelPaymentLink = jest.fn();
const mockEnqueueReminder = jest.fn();
const mockEnqueueImmediateReminder = jest.fn();
const mockRemoveReminderJob = jest.fn();
const mockSendMail = jest.fn();

jest.unstable_mockModule("../../../shared/services/razorpay.service.js", () => ({
    __esModule: true,
    default: {
        createPaymentLink: mockCreatePaymentLink,
        fetchPaymentLink: jest.fn(),
        cancelPaymentLink: mockCancelPaymentLink,
    },
}));

jest.unstable_mockModule("../../../shared/services/reminderQueue.service.js", () => ({
    __esModule: true,
    enqueueReminder: mockEnqueueReminder,
    enqueueImmediateReminder: mockEnqueueImmediateReminder,
    removeReminderJob: mockRemoveReminderJob,
    getReminderJob: jest.fn(),
    default: {
        enqueueReminder: mockEnqueueReminder,
        enqueueImmediateReminder: mockEnqueueImmediateReminder,
        removeReminderJob: mockRemoveReminderJob,
    },
}));

jest.unstable_mockModule("../../../shared/utils/sendMail.util.js", () => ({
    __esModule: true,
    default: mockSendMail,
}));

const { default: createApp } = await import("../../../app.js");
const { default: env } = await import("../../../shared/config/env.config.js");
const { default: Customer } = await import("../../../shared/models/customer.model.js");
const { default: Invoice } = await import("../../../shared/models/invoice.model.js");
const { default: Organization } = await import("../../../shared/models/organization.model.js");
const { default: PaymentLink } = await import("../../../shared/models/paymentLink.model.js");
const { default: Receipt } = await import("../../../shared/models/receipt.model.js");
const { default: Reminder } = await import("../../../shared/models/reminder.model.js");
const { default: ReminderDelivery } = await import("../../../shared/models/reminderDelivery.model.js");
const { LOCK_DURATION_MS } = await import("../../../shared/services/reminder.service.js");

let app;
let mongoServer;
let organization;
let otherOrganization;
let customer;
let invoice;
let token;
let otherToken;

function accessToken(organizationId) {
    return jwt.sign({
        userId: new mongoose.Types.ObjectId().toString(),
        organizationId: organizationId.toString(),
        roles: ["ADMIN"],
        permissions: [],
    }, env.ACCESS_TOKEN_SECRET);
}

async function createReminder(channels = ["email"], overrides = {}) {
    return await request(app)
        .post("/api/reminders")
        .set("Authorization", `Bearer ${token}`)
        .send({
            invoiceId: invoice._id,
            scheduledFor: "2026-08-01T10:00:00.000Z",
            channels,
            title: "Invoice payment reminder",
            ...overrides,
        });
}

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    await Promise.all([PaymentLink.syncIndexes(), Reminder.syncIndexes(), ReminderDelivery.syncIndexes()]);
    app = createApp();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    for (const collection of Object.values(mongoose.connection.collections)) {
        await collection.deleteMany({});
    }

    jest.clearAllMocks();
    mockCreatePaymentLink.mockResolvedValue({
        id: "plink_reminder_1",
        short_url: "https://rzp.io/i/reminder-link",
        status: "created",
        created_at: 1784428200,
    });
    mockCancelPaymentLink.mockResolvedValue({ status: "cancelled" });
    mockEnqueueReminder.mockResolvedValue({
        jobId: "reminder-job",
        queueStatus: "queued",
    });
    mockEnqueueImmediateReminder.mockResolvedValue({
        jobId: "reminder-immediate",
        queueStatus: "queued",
    });
    mockRemoveReminderJob.mockResolvedValue(true);
    mockSendMail.mockResolvedValue("mock-email-message");

    organization = await Organization.create({ name: "Reminder Org", code: "REMINDER" });
    otherOrganization = await Organization.create({ name: "Other Org", code: "OTHER-REM" });
    customer = await Customer.create({
        organizationId: organization._id,
        name: "Asha Customer",
        email: "asha@example.com",
        phone: "98765 43210",
    });
    invoice = await Invoice.create({
        organizationId: organization._id,
        customerId: customer._id,
        invoiceNumber: "INV-REM-001",
        invoiceDate: new Date("2026-07-01T00:00:00.000Z"),
        dueDate: new Date("2026-08-10T00:00:00.000Z"),
        subTotal: 1000,
        taxTotal: 180,
        grandTotal: 1180,
        status: "sent",
    });
    token = accessToken(organization._id);
    otherToken = accessToken(otherOrganization._id);
});

describe("Payment reminders API", () => {
    it("expires abandoned processing locks before the first configured retry", () => {
        expect(LOCK_DURATION_MS).toBeLessThan(env.REMINDER_JOB_BACKOFF_MS);
    });

    it("creates a scheduled email reminder and enqueues one delayed job", async () => {
        const response = await createReminder(["email"]);

        expect(response.status).toBe(201);
        expect(response.body.data.reminder.channels).toEqual(["email"]);
        expect(response.body.data.reminder.emailStatus).toBe("pending");
        expect(response.body.data.reminder.whatsappStatus).toBe("skipped");
        expect(response.body.data.paymentUrl).toBe("https://rzp.io/i/reminder-link");
        expect(mockEnqueueReminder).toHaveBeenCalledTimes(1);
        expect(mockEnqueueReminder).toHaveBeenCalledWith(expect.objectContaining({
            scheduledFor: new Date("2026-08-01T10:00:00.000Z"),
        }));
    });

    it("creates email and WhatsApp channels with a reused PaymentLink", async () => {
        const response = await createReminder(["whatsapp", "email"]);

        expect(response.status).toBe(201);
        expect(response.body.data.reminder.channels).toEqual(["email", "whatsapp"]);
        expect(await PaymentLink.countDocuments({ invoiceId: invoice._id })).toBe(1);
        expect(mockCreatePaymentLink).toHaveBeenCalledTimes(1);
    });

    it("returns a clean queue summary without exposing the BullMQ job", async () => {
        mockEnqueueReminder.mockResolvedValueOnce({
            job: { data: { reminderId: "internal" }, token: "not-for-http" },
            jobId: "reminder-clean-response",
            queueStatus: "queued",
            reused: false,
        });

        const response = await createReminder(["email"]);

        expect(response.status).toBe(201);
        expect(response.body.data.queue).toEqual({
            jobId: "reminder-clean-response",
            queueStatus: "queued",
            reused: false,
        });
        expect(response.body.data.queue.job).toBeUndefined();
    });

    it("keeps the reminder recoverable when its first Redis enqueue fails", async () => {
        mockEnqueueReminder.mockRejectedValueOnce(new Error("Redis unavailable"));

        const response = await createReminder(["email"]);

        expect(response.status).toBe(503);
        const reminder = await Reminder.findOne({ invoiceId: invoice._id });
        expect(reminder.status).toBe("scheduled");
        expect(reminder.queueStatus).toBe("failed");
        expect(reminder.lastError).toBe("Reminder queue is temporarily unavailable.");
    });

    it("rejects duplicate active schedules and duplicate request channels", async () => {
        expect((await createReminder(["email"])).status).toBe(201);

        const duplicateSchedule = await createReminder(["email"]);
        const duplicateChannels = await createReminder(["email", "email"], {
            scheduledFor: "2026-08-02T10:00:00.000Z",
        });

        expect(duplicateSchedule.status).toBe(409);
        expect(duplicateChannels.status).toBe(400);
        expect(await Reminder.countDocuments({ invoiceId: invoice._id })).toBe(1);
    });

    it("uses the database fingerprint to reject simultaneous duplicate schedules", async () => {
        mockCreatePaymentLink.mockImplementationOnce(async () => {
            await new Promise((resolve) => setTimeout(resolve, 75));
            return {
                id: "plink_reminder_concurrent",
                short_url: "https://rzp.io/i/reminder-concurrent",
                status: "created",
                created_at: 1784428200,
            };
        });

        const [first, second] = await Promise.all([
            createReminder(["email"]),
            createReminder(["email"]),
        ]);

        expect([first.status, second.status].sort()).toEqual([201, 409]);
        expect(await Reminder.countDocuments({ invoiceId: invoice._id })).toBe(1);
        expect(mockEnqueueReminder).toHaveBeenCalledTimes(1);
    });

    it("completes without queueing when payment lands during reminder creation", async () => {
        mockCreatePaymentLink.mockImplementationOnce(async () => {
            await Receipt.create({
                organizationId: organization._id,
                customerId: customer._id,
                invoiceId: invoice._id,
                receiptNumber: "REC-DURING-REMINDER-CREATE",
                receiptDate: new Date(),
                amount: 1180,
                paymentMethod: "razorpay",
                accountId: new mongoose.Types.ObjectId(),
            });
            await Invoice.updateOne({ _id: invoice._id }, { $set: { status: "paid" } });
            return {
                id: "plink_paid_during_create",
                short_url: "https://rzp.io/i/paid-during-create",
                status: "created",
                created_at: 1784428200,
            };
        });

        const response = await createReminder(["email"]);

        expect(response.status).toBe(201);
        expect(response.body.data.reminder.status).toBe("completed");
        expect(response.body.data.queue.queueStatus).toBe("completed");
        expect(response.body.data.paymentUrl).toBeNull();
        expect(mockEnqueueReminder).not.toHaveBeenCalled();
    });

    it.each([
        ["email", "email"],
        ["whatsapp", "phone"],
    ])("requires customer contact data for %s", async (channel, contactField) => {
        await Customer.updateOne({ _id: customer._id }, { $unset: { [contactField]: 1 } });

        const response = await createReminder([channel]);

        expect(response.status).toBe(400);
        expect(response.body.message.toLowerCase()).toContain(contactField);
        expect(mockEnqueueReminder).not.toHaveBeenCalled();
    });

    it("does not expose a cross-organization invoice", async () => {
        const response = await request(app)
            .post("/api/reminders")
            .set("Authorization", `Bearer ${otherToken}`)
            .send({
                invoiceId: invoice._id,
                scheduledFor: "2026-08-01T10:00:00.000Z",
                channels: ["email"],
            });

        expect(response.status).toBe(404);
        expect(mockCreatePaymentLink).not.toHaveBeenCalled();
    });

    it("wait=true sends a professional email and generates an encoded WhatsApp deeplink", async () => {
        const created = await createReminder(["email", "whatsapp"]);
        const reminderId = created.body.data.reminder.reminderId;

        const response = await request(app)
            .post(`/api/reminders/${reminderId}/send?wait=true`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.reminder.status).toBe("action_required");
        expect(response.body.data.emailResult.status).toBe("sent");
        expect(response.body.data.whatsappResult.status).toBe("link_generated");
        expect(response.body.data.whatsappDeepLink).toContain("https://wa.me/919876543210?text=");
        expect(response.body.data.whatsappDeepLink).not.toContain(" ");
        expect(mockSendMail).toHaveBeenCalledTimes(1);
        expect(mockSendMail.mock.calls[0][2]).toContain("Duevora");
        expect(mockSendMail.mock.calls[0][2]).toContain("Pay Now");
    });

    it("email success plus an invalid WhatsApp destination becomes partially sent", async () => {
        customer.phone = "invalid phone";
        await customer.save({ validateBeforeSave: false });

        const created = await createReminder(["email", "whatsapp"]);
        const response = await request(app)
            .post(`/api/reminders/${created.body.data.reminder.reminderId}/send?wait=true`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.reminder.status).toBe("partially_sent");
        expect(response.body.data.emailResult.status).toBe("sent");
        expect(response.body.data.whatsappResult.status).toBe("failed");
    });

    it("all automatic channel failures become failed", async () => {
        mockSendMail.mockRejectedValue(new Error("SMTP credentials must stay private"));
        const created = await createReminder(["email"]);

        const response = await request(app)
            .post(`/api/reminders/${created.body.data.reminder.reminderId}/send?wait=true`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.reminder.status).toBe("failed");
        expect(response.body.data.emailResult.status).toBe("failed");
        expect(JSON.stringify(response.body)).not.toContain("credentials");
    });

    it("completes without sending when the invoice is already paid", async () => {
        const created = await createReminder(["email"]);
        await Invoice.updateOne({ _id: invoice._id }, { $set: { status: "paid" } });

        const response = await request(app)
            .post(`/api/reminders/${created.body.data.reminder.reminderId}/send?wait=true`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.reminder.status).toBe("completed");
        expect(response.body.data.outstandingAmount).toBe(0);
        expect(mockSendMail).not.toHaveBeenCalled();
    });

    it("does not resend a channel already marked sent", async () => {
        const created = await createReminder(["email"]);
        await Reminder.updateOne({ _id: created.body.data.reminder.reminderId }, {
            $set: { emailStatus: "sent", status: "sent" },
        });

        const response = await request(app)
            .post(`/api/reminders/${created.body.data.reminder.reminderId}/send?wait=true`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.skipped).toBe(true);
        expect(mockSendMail).not.toHaveBeenCalled();
    });

    it("reconciles a sent delivery audit without calling SMTP again", async () => {
        const created = await createReminder(["email"]);
        const reminderId = created.body.data.reminder.reminderId;
        await Reminder.updateOne({ _id: reminderId }, {
            $set: { status: "failed", emailStatus: "failed", attempts: 1 },
        });
        await ReminderDelivery.create({
            organizationId: organization._id,
            reminderId,
            channel: "email",
            attemptNumber: 1,
            status: "sent",
            provider: "mock_smtp",
            providerMessageId: "smtp-already-accepted",
            destinationMasked: "a***@example.com",
            startedAt: new Date(),
            completedAt: new Date(),
        });
        mockSendMail.mockClear();

        const response = await request(app)
            .post(`/api/reminders/${reminderId}/send?wait=true`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.emailResult.status).toBe("sent");
        expect(mockSendMail).not.toHaveBeenCalled();
        expect((await Reminder.findById(reminderId)).emailStatus).toBe("sent");
    });

    it("queues Send Now using the deterministic reminder job", async () => {
        const created = await createReminder(["email"]);
        const reminderId = created.body.data.reminder.reminderId;

        const response = await request(app)
            .post(`/api/reminders/${reminderId}/send`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.jobId).toBe("reminder-immediate");
        expect(response.body.data.paymentUrl).toBe("https://rzp.io/i/reminder-link");
        expect(mockEnqueueImmediateReminder).toHaveBeenCalledWith(reminderId);
    });

    it("refreshes a stale PaymentLink before queueing Send Now", async () => {
        const created = await createReminder(["email"]);
        const reminderId = created.body.data.reminder.reminderId;
        await Receipt.create({
            organizationId: organization._id,
            customerId: customer._id,
            invoiceId: invoice._id,
            receiptNumber: "REC-BEFORE-SEND-NOW",
            receiptDate: new Date(),
            amount: 180,
            paymentMethod: "bank",
            accountId: new mongoose.Types.ObjectId(),
        });
        await Invoice.updateOne({ _id: invoice._id }, { $set: { status: "partially_paid" } });
        mockCreatePaymentLink.mockResolvedValueOnce({
            id: "plink_reminder_refreshed",
            short_url: "https://rzp.io/i/reminder-refreshed",
            status: "created",
            created_at: 1784428300,
        });

        const response = await request(app)
            .post(`/api/reminders/${reminderId}/send`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.paymentUrl).toBe("https://rzp.io/i/reminder-refreshed");
        expect(mockCancelPaymentLink).toHaveBeenCalledWith("plink_reminder_1");
        expect(mockEnqueueImmediateReminder).toHaveBeenCalledWith(reminderId);
    });

    it("lists and retrieves reminders only inside the authenticated organization", async () => {
        const created = await createReminder(["email"]);
        const reminderId = created.body.data.reminder.reminderId;

        const list = await request(app)
            .get("/api/reminders?status=scheduled&channel=email&limit=10")
            .set("Authorization", `Bearer ${token}`);
        const detail = await request(app)
            .get(`/api/reminders/${reminderId}`)
            .set("Authorization", `Bearer ${token}`);
        const crossOrganization = await request(app)
            .get(`/api/reminders/${reminderId}`)
            .set("Authorization", `Bearer ${otherToken}`);

        expect(list.status).toBe(200);
        expect(list.body.data.reminders).toHaveLength(1);
        expect(list.body.data.pagination.total).toBe(1);
        expect(detail.status).toBe(200);
        expect(detail.body.data.reminderId).toBe(reminderId);
        expect(crossOrganization.status).toBe(404);
    });

    it("cancels a reminder and removes its delayed job", async () => {
        const created = await createReminder(["email"]);
        const reminderId = created.body.data.reminder.reminderId;

        const response = await request(app)
            .patch(`/api/reminders/${reminderId}/cancel`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe("cancelled");
        expect(mockRemoveReminderJob).toHaveBeenCalledWith(reminderId);
    });

    it("keeps cancellation idempotent after the queue job is removed", async () => {
        const created = await createReminder(["email"]);
        const reminderId = created.body.data.reminder.reminderId;

        const first = await request(app)
            .patch(`/api/reminders/${reminderId}/cancel`)
            .set("Authorization", `Bearer ${token}`);
        await Reminder.updateOne({ _id: reminderId }, { $set: { queueStatus: "removed" } });
        const second = await request(app)
            .patch(`/api/reminders/${reminderId}/cancel`)
            .set("Authorization", `Bearer ${token}`);

        expect(first.status).toBe(200);
        expect(second.status).toBe(200);
        expect(second.body.data.status).toBe("cancelled");
        expect(mockRemoveReminderJob).toHaveBeenCalledTimes(1);
    });

    it("rejects delivery for a cancelled reminder", async () => {
        const created = await createReminder(["email"]);
        const reminderId = created.body.data.reminder.reminderId;
        await Reminder.updateOne({ _id: reminderId }, { $set: { status: "cancelled" } });

        const response = await request(app)
            .post(`/api/reminders/${reminderId}/send?wait=true`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(400);
        expect(mockSendMail).not.toHaveBeenCalled();
    });

    it("releases the delivery lock and records failure after a context error", async () => {
        const created = await createReminder(["email"]);
        const reminderId = created.body.data.reminder.reminderId;
        await Organization.deleteOne({ _id: organization._id });

        const response = await request(app)
            .post(`/api/reminders/${reminderId}/send?wait=true`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(404);
        const reminder = await Reminder.findById(reminderId);
        expect(reminder.status).toBe("failed");
        expect(reminder.queueStatus).toBe("failed");
        expect(reminder.processingLockUntil).toBeNull();
        expect(reminder.processingBy).toBeNull();
        expect(reminder.nextAttemptAt).toBeNull();
    });

    it("the processing lock prevents duplicate simultaneous email delivery", async () => {
        const created = await createReminder(["email"]);
        const reminderId = created.body.data.reminder.reminderId;
        mockSendMail.mockImplementation(async () => {
            await new Promise((resolve) => setTimeout(resolve, 100));
            return "one-message";
        });

        const [first, second] = await Promise.all([
            request(app)
                .post(`/api/reminders/${reminderId}/send?wait=true`)
                .set("Authorization", `Bearer ${token}`),
            request(app)
                .post(`/api/reminders/${reminderId}/send?wait=true`)
                .set("Authorization", `Bearer ${token}`),
        ]);

        expect(first.status).toBe(200);
        expect(second.status).toBe(200);
        expect(mockSendMail).toHaveBeenCalledTimes(1);
        expect(await ReminderDelivery.countDocuments({ reminderId, channel: "email" })).toBe(1);
    });
});
