// backend/services/emailService.js
// Uses Brevo's HTTP API (port 443) instead of SMTP (ports 25/465/587),
// which Render blocks on the free tier. No nodemailer needed.

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

async function sendEmail({ to, subject, html }) {
    if (!to || !subject || !html) {
        throw new Error("sendEmail requires to, subject, and html");
    }

    if (!process.env.BREVO_API_KEY) {
        throw new Error("Missing BREVO_API_KEY. Add it to your environment variables.");
    }

    if (!process.env.EMAIL_USER) {
        throw new Error("Missing EMAIL_USER. This must be the sender address you verified in Brevo.");
    }

    try {
        console.log("Sending email via Brevo to:", to);

        const response = await fetch(BREVO_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "api-key": process.env.BREVO_API_KEY
            },
            body: JSON.stringify({
                sender: { name: "SkillSwap", email: process.env.EMAIL_USER },
                to: [{ email: to }],
                subject,
                htmlContent: html
            })
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            console.error("========== BREVO API ERROR ==========");
            console.error("Status:", response.status);
            console.error("Body:", result);
            console.error("======================================");
            throw new Error(result.message || `Brevo API request failed with status ${response.status}`);
        }

        console.log(`Email sent to ${to} with subject: ${subject}`);
        return result;
    } catch (error) {
        console.error("Failed to send email via Brevo:", error.message);
        throw error;
    }
}

module.exports = {
    sendEmail
};