import crypto from "node:crypto";
import env from "../config/env.config.js";
import Organization from "../models/organization.model.js";
import Customer from "../models/customer.model.js";
import Invoice from "../models/invoice.model.js";
import PaymentLink from "../models/paymentLink.model.js";
import Reminder from "../models/reminder.model.js";
import ReminderDelivery from "../models/reminderDelivery.model.js";
import BadRequest from "../errors/BadRequest.error.js";
import Conflict from "../errors/Conflict.error.js";
import NotFound from "../errors/NotFound.error.js";
import ServiceUnavailable from "../errors/ServiceUnavailable.error.js";
import paymentLinkService from "./paymentLink.service.js";
import * as reminderQueueService from "./reminderQueue.service.js";
import sendMail from "../utils/sendMail.util.js";
import buildPaymentReminderEmail from "../utils/paymentReminderEmail.util.js";
import whatsappService from "./whatsapp.service.js";
import { calculateInvoiceBalance } from "./invoiceBalance.service.js";

const ACTIVE_REMINDER_STATUSES = [
    "scheduled",
    "queued",
    "processing",
    "failed",
    "partially_sent",
    "action_required",
];
const CANCELLABLE_REMINDER_STATUSES = [
    "scheduled",
    "queued",
    "failed",
    "partially_sent",
    "action_required",
];
const LOCK_DURATION_MS = 5 * 60 * 1000;

function safeErrorMessage(channel) {
    return channel === "email" ? "Email delivery failed." : "WhatsApp delivery failed.";
}

function maskEmail(email) {
    const [localPart, domain] = String(email).split("@");
    if (!localPart || !domain) return "***";
    return `${localPart.slice(0, 1)}***@${domain}`;
}

function maskPhone(phone) {
    const digits = String(phone).replace(/\D/g, "");
    return digits.length > 4 ? `***${digits.slice(-4)}` : "***";
}

function sanitizeChannelResult(result = {}) {
    return {
        status: result.status,
        providerMessageId: result.providerMessageId,
        requiresSellerAction: Boolean(result.requiresSellerAction),
        retryable: Boolean(result.retryable),
    };
}

function serializeReminder(reminder) {
    const data = reminder?.toObject ? reminder.toObject() : reminder;
    if (!data) return null;

    const referenceId = (value) => value?._id || value;

    return {
        reminderId: data._id,
        organizationId: referenceId(data.organizationId),
        customerId: referenceId(data.customerId),
        invoiceId: referenceId(data.invoiceId),
        paymentLinkId: referenceId(data.paymentLinkId),
        title: data.title,
        description: data.description,
        scheduledFor: data.scheduledFor,
        channels: data.channels,
        status: data.status,
        emailStatus: data.emailStatus,
        whatsappStatus: data.whatsappStatus,
        whatsappDeepLink: data.whatsappDeepLink,
        attempts: data.attempts,
        maxAttempts: data.maxAttempts,
        nextAttemptAt: data.nextAttemptAt,
        lastAttemptAt: data.lastAttemptAt,
        sentAt: data.sentAt,
        completedAt: data.completedAt,
        cancelledAt: data.cancelledAt,
        queueStatus: data.queueStatus,
        queueJobId: data.queueJobId,
        queuedAt: data.queuedAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
    };
}

class ReminderService {

    constructor({
        linkService = paymentLinkService,
        queueService = reminderQueueService,
        mailer = sendMail,
        whatsApp = whatsappService,
    } = {}) {
        this.linkService = linkService;
        this.queueService = queueService;
        this.mailer = mailer;
        this.whatsApp = whatsApp;
    }

    createReminder = async ({ organizationId, createdBy, data }) => {
        const invoice = await Invoice.findOne({
            _id: data.invoiceId,
            organizationId,
        }).lean();

        if (!invoice) {
            throw new NotFound("Invoice not found in your organization.");
        }

        if (!["sent", "partially_paid"].includes(invoice.status)) {
            throw new BadRequest("Reminders can only be created for sent or partially paid invoices.");
        }

        const customer = await Customer.findOne({
            _id: invoice.customerId,
            organizationId,
            isDeleted: { $ne: true },
        }).lean();

        if (!customer) {
            throw new NotFound("Invoice customer not found in your organization.");
        }

        if (data.channels.includes("email") && !customer.email) {
            throw new BadRequest("Customer email is required for email reminders.");
        }

        if (data.channels.includes("whatsapp") && !customer.phone) {
            throw new BadRequest("Customer phone is required for WhatsApp reminders.");
        }

        const balance = await calculateInvoiceBalance({
            organizationId,
            invoiceId: invoice._id,
            invoiceTotal: invoice.grandTotal,
        });

        if (balance.outstandingPaise <= 0) {
            throw new BadRequest("This invoice has no outstanding amount.");
        }

        const scheduledFor = new Date(data.scheduledFor);
        const channels = [...data.channels].sort();
        const duplicate = await Reminder.findOne({
            organizationId,
            invoiceId: invoice._id,
            scheduledFor,
            channels: { $all: channels, $size: channels.length },
            status: { $in: ACTIVE_REMINDER_STATUSES },
        });

        if (duplicate) {
            throw new Conflict("An active reminder already exists for this schedule and channel selection.");
        }

        // Link creation may call Razorpay, so it deliberately happens outside a MongoDB transaction.
        const paymentLink = await this.linkService.createOrReusePaymentLink({
            organizationId,
            invoiceId: invoice._id,
        });

        const reminder = await Reminder.create({
            organizationId,
            customerId: customer._id,
            invoiceId: invoice._id,
            paymentLinkId: paymentLink.paymentLinkId,
            title: data.title?.trim() || `Payment reminder for invoice ${invoice.invoiceNumber}`,
            description: data.description?.trim() || undefined,
            scheduledFor,
            channels,
            status: "scheduled",
            emailStatus: channels.includes("email") ? "pending" : "skipped",
            whatsappStatus: channels.includes("whatsapp") ? "pending" : "skipped",
            maxAttempts: env.REMINDER_JOB_ATTEMPTS,
            createdBy,
        });

        try {
            const queueResult = await this.queueService.enqueueReminder({
                reminderId: reminder._id.toString(),
                scheduledFor,
            });
            const current = await Reminder.findById(reminder._id);

            return {
                reminder: serializeReminder(current || reminder),
                queue: {
                    jobId: queueResult.jobId,
                    queueStatus: queueResult.queueStatus,
                    reused: queueResult.reused,
                },
                paymentUrl: paymentLink.paymentUrl,
                outstandingAmount: balance.outstandingAmount,
            };
        } catch (error) {
            await Reminder.updateOne({ _id: reminder._id }, {
                $set: {
                    queueStatus: "failed",
                    lastError: "Reminder queue is temporarily unavailable.",
                },
            });

            if (error instanceof ServiceUnavailable) throw error;
            throw new ServiceUnavailable("Reminder queue is temporarily unavailable.");
        }
    };

    sendReminder = async ({
        reminderId,
        organizationId,
        source = "manual",
        jobId,
    }) => {
        const filter = {
            _id: reminderId,
            ...(organizationId && { organizationId }),
        };
        let reminder = await Reminder.findOne(filter);

        if (!reminder) {
            throw new NotFound("Reminder not found in your organization.");
        }

        if (["cancelled", "completed"].includes(reminder.status)) {
            if (source === "worker") {
                return { skipped: true, reminder: serializeReminder(reminder) };
            }

            throw new BadRequest(`A ${reminder.status} reminder cannot be sent.`);
        }

        if (this.hasFinishedAllChannels(reminder)) {
            return { skipped: true, reminder: serializeReminder(reminder) };
        }

        const invoice = await Invoice.findOne({
            _id: reminder.invoiceId,
            organizationId: reminder.organizationId,
        });

        if (!invoice) {
            const error = new NotFound("Reminder invoice was not found.");
            error.permanent = true;
            throw error;
        }

        if (!["sent", "partially_paid", "paid"].includes(invoice.status)) {
            const error = new BadRequest("The invoice is no longer eligible for payment reminders.");
            error.permanent = true;
            throw error;
        }

        const balance = await calculateInvoiceBalance({
            organizationId: reminder.organizationId,
            invoiceId: invoice._id,
            invoiceTotal: invoice.grandTotal,
        });

        if (invoice.status === "paid" || balance.outstandingPaise <= 0) {
            reminder.status = "completed";
            reminder.queueStatus = "completed";
            reminder.completedAt = new Date();
            reminder.processingLockUntil = undefined;
            reminder.processingBy = undefined;
            await reminder.save();

            return {
                skipped: true,
                invoiceStatus: "paid",
                outstandingAmount: 0,
                reminder: serializeReminder(reminder),
            };
        }

        const now = new Date();
        const processingBy = `${source}:${jobId || crypto.randomUUID()}`;
        reminder = await Reminder.findOneAndUpdate({
            ...filter,
            status: { $nin: ["cancelled", "completed"] },
            $or: [
                { processingLockUntil: { $exists: false } },
                { processingLockUntil: null },
                { processingLockUntil: { $lte: now } },
            ],
        }, {
            $set: {
                status: "processing",
                queueStatus: "processing",
                processingStartedAt: now,
                processingLockUntil: new Date(now.getTime() + LOCK_DURATION_MS),
                processingBy,
                lastAttemptAt: now,
            },
            $inc: { attempts: 1 },
        }, {
            returnDocument: "after",
            runValidators: true,
        });

        if (!reminder) {
            const current = await Reminder.findOne(filter);
            return {
                skipped: true,
                processing: true,
                reminder: serializeReminder(current),
            };
        }

        try {
            const context = await this.loadDeliveryContext({ reminder, invoice, balance });
            const emailResult = reminder.channels.includes("email")
                ? await this.deliverEmail({ reminder, context, processingBy })
                : { status: "skipped" };
            const whatsappResult = reminder.channels.includes("whatsapp")
                ? await this.deliverWhatsApp({ reminder, context, processingBy })
                : { status: "skipped" };

            const finalState = this.calculateOverallStatus({
                reminder,
                emailResult,
                whatsappResult,
            });
            const retryableFailure = [emailResult, whatsappResult]
                .some((result) => result.status === "failed" && result.retryable);
            const lastError = [emailResult, whatsappResult]
                .find((result) => result.status === "failed")?.safeError;
            const finishedAt = new Date();

            const updated = await Reminder.findOneAndUpdate({
                _id: reminder._id,
                processingBy,
            }, {
                $set: {
                    status: finalState,
                    queueStatus: retryableFailure ? "failed" : "completed",
                    sentAt: ["sent", "partially_sent", "action_required"].includes(finalState)
                        ? finishedAt
                        : reminder.sentAt,
                    nextAttemptAt: retryableFailure
                        ? new Date(finishedAt.getTime() + this.retryDelay(reminder.attempts))
                        : null,
                    lastError: lastError || null,
                    processingLockUntil: null,
                    processingBy: null,
                },
            }, {
                returnDocument: "after",
                runValidators: true,
            });

            const result = {
                reminder: serializeReminder(updated || reminder),
                emailResult: sanitizeChannelResult(emailResult),
                whatsappResult: sanitizeChannelResult(whatsappResult),
                whatsappDeepLink: whatsappResult.deeplink,
                invoiceStatus: invoice.status,
                outstandingAmount: balance.outstandingAmount,
                paymentUrl: context.paymentUrl,
            };

            if (source === "worker" && retryableFailure) {
                const error = new Error("Reminder delivery failed temporarily.");
                error.retryable = true;
                throw error;
            }

            return result;
        } catch (error) {
            const retryable = error?.permanent !== true;
            const failedAt = new Date();

            await Reminder.updateOne({
                _id: reminder._id,
                processingBy,
            }, {
                $set: {
                    status: "failed",
                    processingLockUntil: null,
                    processingBy: null,
                    queueStatus: "failed",
                    nextAttemptAt: retryable
                        ? new Date(failedAt.getTime() + this.retryDelay(reminder.attempts))
                        : null,
                    lastError: error.message === "Reminder delivery failed temporarily."
                        ? error.message
                        : "Reminder delivery could not be completed.",
                },
            });

            throw error;
        }
    };

    cancelReminder = async ({ organizationId, reminderId }) => {
        const existing = await Reminder.findOne({ _id: reminderId, organizationId });

        if (!existing) {
            throw new NotFound("Reminder not found in your organization.");
        }

        if (existing.status === "cancelled") {
            if (existing.queueStatus !== "removed") {
                await this.queueService.removeReminderJob(reminderId);
            }

            return serializeReminder(await Reminder.findById(existing._id));
        }

        if (!CANCELLABLE_REMINDER_STATUSES.includes(existing.status)) {
            throw new BadRequest("This reminder can no longer be cancelled.");
        }

        const reminder = await Reminder.findOneAndUpdate({
            _id: reminderId,
            organizationId,
            status: { $in: CANCELLABLE_REMINDER_STATUSES },
        }, {
            $set: {
                status: "cancelled",
                cancelledAt: new Date(),
                processingLockUntil: null,
                processingBy: null,
            },
        }, {
            returnDocument: "after",
            runValidators: true,
        });

        try {
            await this.queueService.removeReminderJob(reminderId);
        } catch (error) {
            await Reminder.updateOne({ _id: reminderId }, {
                $set: {
                    queueStatus: "failed",
                    lastError: "Reminder queue is temporarily unavailable.",
                },
            });
            throw error;
        }

        return serializeReminder(await Reminder.findById(reminder._id));
    };

    enqueueImmediateReminder = async ({ organizationId, reminderId }) => {
        const reminder = await Reminder.findOne({ _id: reminderId, organizationId });

        if (!reminder) {
            throw new NotFound("Reminder not found in your organization.");
        }

        if (["cancelled", "completed"].includes(reminder.status)) {
            throw new BadRequest(`A ${reminder.status} reminder cannot be sent.`);
        }

        const paymentLink = await PaymentLink.findOne({
            _id: reminder.paymentLinkId,
            organizationId,
        }).select("shortUrl");
        const queue = await this.queueService.enqueueImmediateReminder(reminder._id.toString());
        const current = await Reminder.findById(reminder._id);

        return {
            reminderId: reminder._id,
            jobId: queue.jobId,
            queueStatus: current?.queueStatus || "queued",
            paymentUrl: paymentLink?.shortUrl,
        };
    };

    getReminder = async ({ organizationId, reminderId }) => {
        const reminder = await Reminder.findOne({ _id: reminderId, organizationId });

        if (!reminder) {
            throw new NotFound("Reminder not found in your organization.");
        }

        return serializeReminder(reminder);
    };

    listReminders = async ({ organizationId, filters }) => {
        const query = { organizationId };

        if (filters.status) query.status = filters.status;
        if (filters.invoiceId) query.invoiceId = filters.invoiceId;
        if (filters.customerId) query.customerId = filters.customerId;
        if (filters.channel) query.channels = filters.channel;
        if (filters.scheduledFrom || filters.scheduledTo) {
            query.scheduledFor = {
                ...(filters.scheduledFrom && { $gte: new Date(filters.scheduledFrom) }),
                ...(filters.scheduledTo && { $lte: new Date(filters.scheduledTo) }),
            };
        }

        const page = filters.page || 1;
        const limit = Math.min(filters.limit || 20, 100);
        const sortBy = filters.sortBy || "scheduledFor";
        const sortOrder = filters.sortOrder === "asc" ? 1 : -1;
        const [reminders, total] = await Promise.all([
            Reminder.find(query)
                .sort({ [sortBy]: sortOrder })
                .skip((page - 1) * limit)
                .limit(limit),
            Reminder.countDocuments(query),
        ]);

        return {
            reminders: reminders.map(serializeReminder),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    };

    completePaidInvoiceReminders = async ({ organizationId, invoiceId, session = null }) => {
        let query = Reminder.find({
            organizationId,
            invoiceId,
            status: { $in: ACTIVE_REMINDER_STATUSES },
        }).select("_id");
        if (session) query = query.session(session);
        const reminders = await query;
        const reminderIds = reminders.map((reminder) => reminder._id);

        if (reminderIds.length > 0) {
            await Reminder.updateMany({ _id: { $in: reminderIds } }, {
                $set: {
                    status: "completed",
                    queueStatus: "completed",
                    completedAt: new Date(),
                    processingLockUntil: null,
                    processingBy: null,
                },
            }, { session });
        }

        if (!session) {
            await Promise.allSettled(
                reminderIds.map((id) => this.queueService.removeReminderJob(id.toString()))
            );
        }

        return reminderIds.map((id) => id.toString());
    };

    loadDeliveryContext = async ({ reminder, invoice, balance }) => {
        const [customer, organization] = await Promise.all([
            Customer.findOne({
                _id: reminder.customerId,
                organizationId: reminder.organizationId,
                isDeleted: { $ne: true },
            }).lean(),
            Organization.findById(reminder.organizationId).lean(),
        ]);

        if (!customer || !organization) {
            const error = new NotFound("Reminder delivery context was not found.");
            error.permanent = true;
            throw error;
        }

        if (reminder.channels.includes("email") && !customer.email) {
            const error = new BadRequest("Customer email is required for email reminders.");
            error.permanent = true;
            throw error;
        }

        if (reminder.channels.includes("whatsapp") && !customer.phone) {
            const error = new BadRequest("Customer phone is required for WhatsApp reminders.");
            error.permanent = true;
            throw error;
        }

        let paymentLink = await PaymentLink.findOne({
            _id: reminder.paymentLinkId,
            organizationId: reminder.organizationId,
            active: true,
            status: { $in: ["created", "partially_paid"] },
        });

        if (
            !paymentLink
            || !paymentLink.shortUrl
            || paymentLink.amountDuePaise !== balance.outstandingPaise
            || (paymentLink.expiresAt && paymentLink.expiresAt.getTime() <= Date.now())
        ) {
            const linkResult = await this.linkService.createOrReusePaymentLink({
                organizationId: reminder.organizationId,
                invoiceId: invoice._id,
            });
            paymentLink = await PaymentLink.findById(linkResult.paymentLinkId);
            reminder.paymentLinkId = paymentLink._id;
            await Reminder.updateOne({ _id: reminder._id }, { $set: { paymentLinkId: paymentLink._id } });
        }

        return {
            customer,
            organization,
            invoice,
            balance,
            paymentUrl: paymentLink.shortUrl,
        };
    };

    deliverEmail = async ({ reminder, context, processingBy }) => {
        if (reminder.emailStatus === "sent") return { status: "sent", alreadyDelivered: true };

        const attemptNumber = reminder.attempts;
        const delivery = await this.claimDelivery({
            reminder,
            channel: "email",
            attemptNumber,
            provider: env.SEND_MAIL ? "smtp" : "mock_smtp",
            destinationMasked: maskEmail(context.customer.email),
        });

        if (["sent", "skipped"].includes(delivery.status)) {
            return { status: delivery.status, providerMessageId: delivery.providerMessageId };
        }

        try {
            const email = buildPaymentReminderEmail({
                organization: context.organization,
                customer: context.customer,
                invoice: context.invoice,
                amountPaid: context.balance.totalPaid,
                outstandingAmount: context.balance.outstandingAmount,
                paymentUrl: context.paymentUrl,
            });
            const providerMessageId = await this.mailer(
                context.customer.email,
                email.subject,
                email.html,
                { text: email.text }
            );

            await Promise.all([
                ReminderDelivery.updateOne({ _id: delivery._id }, {
                    $set: { status: "sent", providerMessageId, completedAt: new Date() },
                }),
                Reminder.updateOne({ _id: reminder._id, processingBy }, {
                    $set: { emailStatus: "sent", emailProviderMessageId: providerMessageId },
                }),
            ]);

            reminder.emailStatus = "sent";
            return { status: "sent", providerMessageId };
        } catch {
            await Promise.all([
                ReminderDelivery.updateOne({ _id: delivery._id }, {
                    $set: {
                        status: "failed",
                        completedAt: new Date(),
                        errorCode: "EMAIL_DELIVERY_FAILED",
                        errorMessage: "Email delivery failed.",
                    },
                }),
                Reminder.updateOne({ _id: reminder._id, processingBy }, {
                    $set: { emailStatus: "failed" },
                }),
            ]);

            reminder.emailStatus = "failed";
            return {
                status: "failed",
                retryable: true,
                safeError: safeErrorMessage("email"),
            };
        }
    };

    deliverWhatsApp = async ({ reminder, context, processingBy }) => {
        if (["sent", "link_generated"].includes(reminder.whatsappStatus)) {
            return {
                status: reminder.whatsappStatus,
                deeplink: reminder.whatsappDeepLink,
                requiresSellerAction: reminder.whatsappStatus === "link_generated",
            };
        }

        const provider = env.WHATSAPP_MODE === "cloud"
            ? "whatsapp_cloud"
            : "whatsapp_deeplink";
        const delivery = await this.claimDelivery({
            reminder,
            channel: "whatsapp",
            attemptNumber: reminder.attempts,
            provider,
            destinationMasked: maskPhone(context.customer.phone),
        });

        if (["sent", "link_generated", "skipped"].includes(delivery.status)) {
            return {
                status: delivery.status,
                providerMessageId: delivery.providerMessageId,
                requiresSellerAction: delivery.status === "link_generated",
            };
        }

        let result;

        try {
            result = await this.whatsApp.sendReminder({
                organization: context.organization,
                customer: context.customer,
                invoice: context.invoice,
                outstandingAmount: context.balance.outstandingAmount,
                paymentUrl: context.paymentUrl,
            });
        } catch {
            result = {
                status: "failed",
                provider,
                retryable: true,
                requiresSellerAction: false,
            };
        }
        const status = result.status;
        const reminderStatus = status === "link_generated"
            ? "link_generated"
            : status === "sent" ? "sent" : status === "skipped" ? "skipped" : "failed";

        await Promise.all([
            ReminderDelivery.updateOne({ _id: delivery._id }, {
                $set: {
                    status: reminderStatus,
                    provider: result.provider || provider,
                    providerMessageId: result.providerMessageId,
                    completedAt: new Date(),
                    ...(status === "failed" && {
                        errorCode: "WHATSAPP_DELIVERY_FAILED",
                        errorMessage: "WhatsApp delivery failed.",
                    }),
                },
            }),
            Reminder.updateOne({ _id: reminder._id, processingBy }, {
                $set: {
                    whatsappStatus: reminderStatus,
                    whatsappProviderMessageId: result.providerMessageId,
                    whatsappDeepLink: result.deeplink,
                },
            }),
        ]);

        reminder.whatsappStatus = reminderStatus;
        reminder.whatsappDeepLink = result.deeplink;
        return {
            ...result,
            safeError: status === "failed" ? safeErrorMessage("whatsapp") : undefined,
        };
    };

    claimDelivery = async ({ reminder, channel, attemptNumber, provider, destinationMasked }) => {
        try {
            return await ReminderDelivery.create({
                organizationId: reminder.organizationId,
                reminderId: reminder._id,
                channel,
                attemptNumber,
                status: "processing",
                provider,
                destinationMasked,
                startedAt: new Date(),
            });
        } catch (error) {
            if (error?.code !== 11000) throw error;
            return await ReminderDelivery.findOne({
                reminderId: reminder._id,
                channel,
                attemptNumber,
            });
        }
    };

    calculateOverallStatus = ({ reminder, emailResult, whatsappResult }) => {
        const requestedResults = [];
        if (reminder.channels.includes("email")) requestedResults.push(emailResult);
        if (reminder.channels.includes("whatsapp")) requestedResults.push(whatsappResult);

        if (requestedResults.some((result) => result.status === "link_generated")) {
            return "action_required";
        }

        const failures = requestedResults.filter((result) => result.status === "failed");
        const delivered = requestedResults.filter((result) => result.status === "sent");

        if (failures.length === 0) return "sent";
        if (delivered.length > 0) return "partially_sent";
        return "failed";
    };

    hasFinishedAllChannels = (reminder) => {
        return reminder.channels.every((channel) => {
            if (channel === "email") return reminder.emailStatus === "sent";
            return ["sent", "link_generated", "skipped"].includes(reminder.whatsappStatus);
        });
    };

    retryDelay = (attempts) => {
        return env.REMINDER_JOB_BACKOFF_MS * (2 ** Math.max(attempts - 1, 0));
    };

}

const reminderService = new ReminderService();

const completePaidInvoiceReminders = async (options) => (
    await reminderService.completePaidInvoiceReminders(options)
);

export { ReminderService, completePaidInvoiceReminders, serializeReminder };
export default reminderService;
