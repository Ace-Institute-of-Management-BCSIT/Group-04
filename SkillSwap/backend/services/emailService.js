const { Resend } = require("resend");

const resendApiKey = process.env.RESEND_API_KEY;
const resend = new Resend(resendApiKey);

const fromEmail = process.env.RESEND_FROM_EMAIL || "SkillSwap <onboarding@resend.dev>"; // Replace onboarding@resend.dev after domain verification.

if (!resendApiKey) {
    console.warn("RESEND_API_KEY is not set. Add RESEND_API_KEY=re_xxxxxxxxx to backend/.env before enabling email delivery.");
}

async function sendEmail({ to, subject, html }) {
    if (!to || !subject || !html) {
        throw new Error("sendEmail requires to, subject, and html");
    }

    if (!resendApiKey) {
        throw new Error("Missing RESEND_API_KEY. Set it in backend/.env before sending email.");
    }

    try {
        console.log("Sending OTP to:", to);
        const result = await resend.emails.send({
            from: fromEmail,
            to,
            subject,
            html
        });

        console.log(`Resend email sent to ${to} with subject: ${subject}`);
        return result;
    } catch (error) {
        console.error("Resend email error:", {
            to,
            subject,
            message: error.message
        });
        throw error;
    }
}

module.exports = {
    sendEmail
};