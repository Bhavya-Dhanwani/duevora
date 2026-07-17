// Importing modules
import sendMail from "../../../shared/utils/sendMail.util.js";
import Ok from "../../../shared/responses/Ok.response.js";
import env from "../../../shared/config/env.config.js";

class ContactController {

    // @route  POST /api/contact
    // @desc   Handle contact form submission — sends confirmation to sender + notification to admin
    // @access Public
    contact = async (req, res) => {

        const { name, email, phone, subject, message } = req.body;

        // ── 1. Confirmation email to the person who submitted the form ──────────
        sendMail(
            email,
            `We received your message — ${subject}`,
            `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #1d4ed8;">Thanks for reaching out, ${name}!</h2>
                <p style="color: #374151;">We have received your message and will get back to you within <strong>1–2 business days</strong>.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                <h4 style="color: #6b7280; margin-bottom: 4px;">Your submission details:</h4>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #374151;">
                    <tr><td style="padding: 6px 0; font-weight: bold; width: 30%;">Name</td><td>${name}</td></tr>
                    <tr><td style="padding: 6px 0; font-weight: bold;">Email</td><td>${email}</td></tr>
                    <tr><td style="padding: 6px 0; font-weight: bold;">Phone</td><td>${phone}</td></tr>
                    <tr><td style="padding: 6px 0; font-weight: bold;">Subject</td><td>${subject}</td></tr>
                    <tr><td style="padding: 6px 0; font-weight: bold; vertical-align: top;">Message</td><td>${message}</td></tr>
                </table>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                <p style="color: #9ca3af; font-size: 12px;">This is an automated confirmation. Please do not reply to this email.</p>
            </div>
            `
        );

        // ── 2. Notification email to the admin / support inbox ───────────────────
        sendMail(
            env.SENDING_USER,
            `[Contact Form] ${subject} — from ${name}`,
            `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #fca5a5; border-radius: 8px; background: #fff7f7;">
                <h2 style="color: #b91c1c;">📬 New Contact Form Submission</h2>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #374151;">
                    <tr><td style="padding: 8px 0; font-weight: bold; width: 30%;">Name</td><td>${name}</td></tr>
                    <tr><td style="padding: 8px 0; font-weight: bold;">Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
                    <tr><td style="padding: 8px 0; font-weight: bold;">Phone</td><td>${phone}</td></tr>
                    <tr><td style="padding: 8px 0; font-weight: bold;">Subject</td><td>${subject}</td></tr>
                    <tr><td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Message</td><td style="white-space: pre-wrap;">${message}</td></tr>
                </table>
                <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">Submitted at ${new Date().toUTCString()}</p>
            </div>
            `
        );

        return Ok(res, "Your message has been sent successfully. We will get back to you soon.");

    };

}

export default ContactController;
