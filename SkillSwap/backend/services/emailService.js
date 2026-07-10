// backend/services/emailService.js
// Uses SendGrid's HTTP API (port 443) instead of SMTP (ports 25/465/587),
// which Render blocks on the free tier. No nodemailer needed.

const SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send";

async function sendEmail({ to, subject, html }) {
    if (!to || !subject || !html) {
        throw new Error("sendEmail requires to, subject, and html");
    }

    if (!process.env.SENDGRID_API_KEY) {
        throw new Error("Missing SENDGRID_API_KEY. Add it to your environment variables.");
    }

    if (!process.env.EMAIL_USER) {
        throw new Error("Missing EMAIL_USER. This must be the sender address you verified in SendGrid.");
    }

    try {
        console.log("Sending email via SendGrid to:", to);

        const response = await fetch(SENDGRID_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.SENDGRID_API_KEY}`
            },
            body: JSON.stringify({
                personalizations: [{ to: [{ email: to }] }],
                from: { email: process.env.EMAIL_USER, name: "SkillSwap" },
                subject,
                content: [{ type: "text/html", value: html }]
            })
        });

        if (!response.ok) {
            const result = await response.json().catch(() => ({}));

            console.error("========== SENDGRID API ERROR ==========");
            console.error("Status:", response.status);
            console.error("Body:", result);
            console.error("======================================");
            throw new Error(result.errors?.[0]?.message || result.message || `SendGrid API request failed with status ${response.status}`);
        }

        console.log(`Email sent to ${to} with subject: ${subject}`);
        return;
    } catch (error) {
        console.error("Failed to send email via SendGrid:", error.message);
        throw error;
    }
}

module.exports = {
    sendEmail
};