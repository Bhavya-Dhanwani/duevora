import escapeHtml from "../escapeHtml.util.js";
import { fromPaise, roundMoney, toPaise } from "../money.util.js";
import normalizePhoneNumber from "../phone.util.js";

describe("money utilities", () => {
    it("converts rupees to integer paise without floating-point drift", () => {
        expect(toPaise(1.005)).toBe(101);
        expect(toPaise(10.075)).toBe(1008);
        expect(toPaise(0.1 + 0.2)).toBe(30);
    });

    it("converts paise to rupees and rounds money to two decimals", () => {
        expect(fromPaise(1008)).toBe(10.08);
        expect(roundMoney(15.456)).toBe(15.46);
    });

    it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, -0.01])(
        "rejects an unsafe rupee amount: %s",
        (amount) => {
            expect(() => toPaise(amount)).toThrow();
        }
    );

    it("rejects fractional and negative paise", () => {
        expect(() => fromPaise(1.5)).toThrow("safe integer");
        expect(() => fromPaise(-1)).toThrow("cannot be negative");
    });
});

describe("phone utility", () => {
    it("normalizes formatting and preserves an explicit country code", () => {
        expect(normalizePhoneNumber("+91 (98765) 43210", "91")).toBe("919876543210");
    });

    it("applies the configured country code to a local number", () => {
        expect(normalizePhoneNumber("98765-43210", "91")).toBe("919876543210");
    });

    it("removes a local trunk zero before adding the configured country code", () => {
        expect(normalizePhoneNumber("09876543210", "91")).toBe("919876543210");
    });

    it("preserves a valid unmarked international number", () => {
        expect(normalizePhoneNumber("1 (415) 555-2671", "91")).toBe("14155552671");
    });

    it.each(["", "phone: 9876543210", "+999 123456789", "123"])(
        "rejects an invalid phone value without echoing it: %s",
        (phone) => {
            expect(() => normalizePhoneNumber(phone, "91")).toThrow();
        }
    );

    it("rejects an unknown default calling code", () => {
        expect(() => normalizePhoneNumber("9876543210", "999")).toThrow(
            "WhatsApp default country code is invalid"
        );
    });
});

describe("HTML escaping utility", () => {
    it("escapes customer-controlled HTML characters", () => {
        expect(escapeHtml(`<script data-name="O'Reilly">&\`</script>`)).toBe(
            "&lt;script data-name=&quot;O&#39;Reilly&quot;&gt;&amp;&#96;&lt;/script&gt;"
        );
    });

    it("returns an empty string for absent optional values", () => {
        expect(escapeHtml(null)).toBe("");
        expect(escapeHtml(undefined)).toBe("");
    });
});
