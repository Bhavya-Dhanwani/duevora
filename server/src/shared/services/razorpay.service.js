import env from "../config/env.config.js";
import logger from "../config/logger.config.js";
import BadGateway from "../errors/BadGateway.error.js";
import ServiceUnavailable from "../errors/ServiceUnavailable.error.js";

const REQUEST_TIMEOUT_MS = 10000;

class RazorpayService {

    constructor(fetchImplementation = globalThis.fetch, loggerInstance = logger) {
        this.fetch = fetchImplementation;
        this.logger = loggerInstance;
    }

    createPaymentLink = async (payload) => {
        return await this.request("/payment_links", {
            method: "POST",
            body: payload,
            operation: "create_payment_link",
            frontendMessage: "Unable to create payment link at this time.",
        });
    };

    fetchPaymentLink = async (providerPaymentLinkId) => {
        return await this.request(`/payment_links/${encodeURIComponent(providerPaymentLinkId)}`, {
            method: "GET",
            operation: "fetch_payment_link",
            frontendMessage: "Unable to retrieve payment link at this time.",
        });
    };

    cancelPaymentLink = async (providerPaymentLinkId) => {
        return await this.request(`/payment_links/${encodeURIComponent(providerPaymentLinkId)}/cancel`, {
            method: "POST",
            operation: "cancel_payment_link",
            frontendMessage: "Unable to cancel payment link at this time.",
        });
    };

    request = async (path, { method, body, operation, frontendMessage }) => {
        if (!env.RAZORPAY_ENABLED) {
            throw new ServiceUnavailable("Razorpay payment links are not enabled.");
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        try {
            const credentials = Buffer.from(
                `${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`,
                "utf8"
            ).toString("base64");

            const response = await this.fetch(`${env.RAZORPAY_API_BASE_URL}${path}`, {
                method,
                headers: {
                    Authorization: `Basic ${credentials}`,
                    Accept: "application/json",
                    ...(body && { "Content-Type": "application/json" }),
                },
                ...(body && { body: JSON.stringify(body) }),
                signal: controller.signal,
            });

            const responseText = await response.text();
            let responseBody = null;

            if (responseText) {
                try {
                    responseBody = JSON.parse(responseText);
                } catch {
                    responseBody = null;
                }
            }

            if (!response.ok) {
                const providerCode = typeof responseBody?.error?.code === "string"
                    ? responseBody.error.code.slice(0, 80)
                    : undefined;

                this.logger.warn({
                    provider: "razorpay",
                    operation,
                    providerStatus: response.status,
                    providerCode,
                }, "Razorpay request failed");

                const error = new BadGateway(frontendMessage);
                error.providerCode = providerCode;
                error.providerStatus = response.status;
                error.retryable = response.status === 429 || response.status >= 500;
                throw error;
            }

            if (!responseBody || typeof responseBody !== "object") {
                throw new BadGateway(frontendMessage);
            }

            return responseBody;
        } catch (error) {
            if (error instanceof BadGateway || error instanceof ServiceUnavailable) {
                throw error;
            }

            this.logger.warn({
                provider: "razorpay",
                operation,
                errorName: error.name,
            }, "Razorpay network request failed");

            const mappedError = new BadGateway(frontendMessage);
            mappedError.retryable = true;
            throw mappedError;
        } finally {
            clearTimeout(timeout);
        }
    };

}

const razorpayService = new RazorpayService();

export { RazorpayService };
export default razorpayService;
