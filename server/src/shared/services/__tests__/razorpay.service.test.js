import { jest } from "@jest/globals";

jest.unstable_mockModule("../../config/env.config.js", () => ({
    __esModule: true,
    default: {
        RAZORPAY_ENABLED: true,
        RAZORPAY_KEY_ID: "test-key",
        RAZORPAY_KEY_SECRET: "test-secret",
        RAZORPAY_API_BASE_URL: "https://api.razorpay.com/v1",
    },
}));

const { RazorpayService } = await import("../razorpay.service.js");

function providerResponse(status, body) {
    return {
        ok: status >= 200 && status < 300,
        status,
        text: jest.fn().mockResolvedValue(JSON.stringify(body)),
    };
}

describe("RazorpayService safe logging", () => {
    it("uses a fixed operation name without logging a provider payment-link ID", async () => {
        const providerPaymentLinkId = "plink_private_identifier";
        const fetchImplementation = jest.fn().mockResolvedValue(providerResponse(500, {
            error: { code: "SERVER_ERROR" },
        }));
        const logger = { warn: jest.fn() };
        const service = new RazorpayService(fetchImplementation, logger);

        await expect(service.fetchPaymentLink(providerPaymentLinkId))
            .rejects.toThrow("Unable to retrieve payment link at this time.");

        expect(logger.warn).toHaveBeenCalledWith({
            provider: "razorpay",
            operation: "fetch_payment_link",
            providerStatus: 500,
            providerCode: "SERVER_ERROR",
        }, "Razorpay request failed");
        expect(JSON.stringify(logger.warn.mock.calls)).not.toContain(providerPaymentLinkId);
    });

    it("maps network failures without logging the request path", async () => {
        const fetchImplementation = jest.fn().mockRejectedValue(new Error("network down"));
        const logger = { warn: jest.fn() };
        const service = new RazorpayService(fetchImplementation, logger);

        await expect(service.cancelPaymentLink("plink_private_identifier"))
            .rejects.toThrow("Unable to cancel payment link at this time.");

        expect(logger.warn).toHaveBeenCalledWith({
            provider: "razorpay",
            operation: "cancel_payment_link",
            errorName: "Error",
        }, "Razorpay network request failed");
        expect(JSON.stringify(logger.warn.mock.calls)).not.toContain("plink_private_identifier");
    });
});
