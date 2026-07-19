import env from "../config/env.config.js";

const COUNTRY_CALLING_CODES = new Set([
    "1", "7", "20", "27", "30", "31", "32", "33", "34", "36", "39", "40", "41", "43", "44", "45", "46", "47", "48", "49",
    "51", "52", "53", "54", "55", "56", "57", "58", "60", "61", "62", "63", "64", "65", "66", "81", "82", "84", "86",
    "90", "91", "92", "93", "94", "95", "98", "211", "212", "213", "216", "218", "220", "221", "222", "223", "224", "225",
    "226", "227", "228", "229", "230", "231", "232", "233", "234", "235", "236", "237", "238", "239", "240", "241", "242",
    "243", "244", "245", "246", "247", "248", "249", "250", "251", "252", "253", "254", "255", "256", "257", "258", "260",
    "261", "262", "263", "264", "265", "266", "267", "268", "269", "290", "291", "297", "298", "299", "350", "351", "352",
    "353", "354", "355", "356", "357", "358", "359", "370", "371", "372", "373", "374", "375", "376", "377", "378", "379",
    "380", "381", "382", "383", "385", "386", "387", "389", "420", "421", "423", "500", "501", "502", "503", "504", "505",
    "506", "507", "508", "509", "590", "591", "592", "593", "594", "595", "596", "597", "598", "599", "670", "672", "673",
    "674", "675", "676", "677", "678", "679", "680", "681", "682", "683", "685", "686", "687", "688", "689", "690", "691",
    "692", "800", "808", "850", "852", "853", "855", "856", "870", "878", "880", "881", "882", "883", "886", "888", "960",
    "961", "962", "963", "964", "965", "966", "967", "968", "970", "971", "972", "973", "974", "975", "976", "977", "979",
    "992", "993", "994", "995", "996", "998",
]);

const PHONE_FORMAT_PATTERN = /^\+?[\d\s\-()[\]{}]+$/;
const E164_MIN_DIGITS = 8;
const E164_MAX_DIGITS = 15;

function hasValidCountryCallingCode(phoneDigits) {
    for (let length = 3; length >= 1; length -= 1) {
        if (COUNTRY_CALLING_CODES.has(phoneDigits.slice(0, length))) {
            return true;
        }
    }

    return false;
}

function normalizeCountryCode(countryCode) {
    const normalized = String(countryCode ?? "").replace(/^\+/, "").trim();

    if (!/^\d{1,3}$/.test(normalized) || !COUNTRY_CALLING_CODES.has(normalized)) {
        throw new Error("WhatsApp default country code is invalid");
    }

    return normalized;
}

function normalizePhoneNumber(phone, defaultCountryCode = env.WHATSAPP_DEFAULT_COUNTRY_CODE) {
    if (typeof phone !== "string" || phone.trim().length === 0) {
        throw new TypeError("Phone number must be a non-empty string");
    }

    const trimmedPhone = phone.trim();

    if (!PHONE_FORMAT_PATTERN.test(trimmedPhone)) {
        throw new Error("Phone number contains unsupported characters");
    }

    const hasInternationalPrefix = trimmedPhone.startsWith("+");
    const phoneDigits = trimmedPhone.replace(/^\+/, "").replace(/[\s\-()[\]{}]/g, "");
    const countryCode = normalizeCountryCode(defaultCountryCode);

    if (!/^\d+$/.test(phoneDigits)) {
        throw new Error("Phone number must contain digits only");
    }

    let normalizedPhone = phoneDigits;
    const hasUnmarkedCountryCode = phoneDigits.length > 10 && hasValidCountryCallingCode(phoneDigits);

    if (hasInternationalPrefix) {
        if (!hasValidCountryCallingCode(phoneDigits)) {
            throw new Error("Phone number has an invalid country code");
        }
    } else if (!hasUnmarkedCountryCode) {
        // Local trunk prefixes are not part of the E.164 national number.
        const localDigits = phoneDigits.replace(/^0(?=\d{7,14}$)/, "");
        normalizedPhone = `${countryCode}${localDigits}`;
    }

    if (normalizedPhone.length < E164_MIN_DIGITS || normalizedPhone.length > E164_MAX_DIGITS) {
        throw new RangeError("Phone number must contain 8 to 15 digits including country code");
    }

    return normalizedPhone;
}

const normalizePhone = normalizePhoneNumber;

export { normalizePhone, normalizePhoneNumber };
export default normalizePhoneNumber;
