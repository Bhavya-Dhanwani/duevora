import mongoose from "mongoose";
import env from "../../config/env.config.js";
import Reminder from "../reminder.model.js";
import ReminderDelivery from "../reminderDelivery.model.js";

function hasIndex(model, expectedFields, expectedOptions = {}) {
    return model.schema.indexes().some(([fields, options]) => (
        JSON.stringify(fields) === JSON.stringify(expectedFields)
        && Object.entries(expectedOptions).every(([key, value]) => (
            JSON.stringify(options[key]) === JSON.stringify(value)
        ))
    ));
}

function reminderData(overrides = {}) {
    return {
        organizationId: new mongoose.Types.ObjectId(),
        customerId: new mongoose.Types.ObjectId(),
        invoiceId: new mongoose.Types.ObjectId(),
        paymentLinkId: new mongoose.Types.ObjectId(),
        title: "Invoice payment reminder",
        scheduledFor: new Date(),
        channels: ["email", "whatsapp"],
        ...overrides,
    };
}

describe("Reminder model", () => {
    it("applies scheduling, channel and queue defaults", async () => {
        const reminder = new Reminder(reminderData());
        await expect(reminder.validate()).resolves.toBeUndefined();

        expect(reminder.status).toBe("scheduled");
        expect(reminder.emailStatus).toBe("pending");
        expect(reminder.whatsappStatus).toBe("pending");
        expect(reminder.queueStatus).toBe("pending");
        expect(reminder.attempts).toBe(0);
        expect(reminder.maxAttempts).toBe(env.REMINDER_JOB_ATTEMPTS);
    });

    it("requires at least one unique supported channel", async () => {
        await expect(new Reminder(reminderData({ channels: [] })).validate())
            .rejects.toThrow("At least one reminder channel");
        await expect(new Reminder(reminderData({ channels: ["email", "email"] })).validate())
            .rejects.toThrow("must be unique");
        await expect(new Reminder(reminderData({ channels: ["sms"] })).validate())
            .rejects.toThrow();
    });

    it("uses customer payment-link references and removes outgoing payment fields", () => {
        expect(Reminder.schema.path("customerId").options.ref).toBe("Customer");
        expect(Reminder.schema.path("paymentLinkId").options.ref).toBe("PaymentLink");
        expect(Reminder.schema.path("paymentId")).toBeUndefined();
        expect(Reminder.schema.path("dueDate")).toBeUndefined();
    });

    it("declares scheduling and recovery indexes", () => {
        expect(hasIndex(Reminder, { organizationId: 1, scheduledFor: 1, status: 1 })).toBe(true);
        expect(hasIndex(Reminder, { queueStatus: 1, scheduledFor: 1 })).toBe(true);
        expect(hasIndex(Reminder, {
            status: 1,
            nextAttemptAt: 1,
            processingLockUntil: 1,
        })).toBe(true);
        expect(hasIndex(Reminder, {
            organizationId: 1,
            activeDedupeKey: 1,
        }, {
            unique: true,
            partialFilterExpression: { activeDedupeKey: { $type: "string" } },
        })).toBe(true);
    });
});

describe("ReminderDelivery model", () => {
    it("creates a safe processing audit record", async () => {
        const delivery = new ReminderDelivery({
            organizationId: new mongoose.Types.ObjectId(),
            reminderId: new mongoose.Types.ObjectId(),
            channel: "email",
            attemptNumber: 1,
            provider: "smtp",
            destinationMasked: "r***@example.com",
        });

        await expect(delivery.validate()).resolves.toBeUndefined();
        expect(delivery.status).toBe("processing");
        expect(delivery.startedAt).toBeInstanceOf(Date);
    });

    it("declares a unique key for an idempotent channel attempt", () => {
        expect(hasIndex(ReminderDelivery, {
            reminderId: 1,
            channel: 1,
            attemptNumber: 1,
        }, { unique: true })).toBe(true);
    });
});
