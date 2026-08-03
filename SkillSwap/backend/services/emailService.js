// backend/services/emailService.js
// Uses SendGrid's HTTP API (port 443) instead of SMTP (ports 25/465/587),
// which Render blocks on the free tier. No nodemailer needed.

const SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send";

function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function buildSkillVerificationEmailHtml({ title, providerName, skillName, status, feedback }) {
    const safeProviderName = escapeHtml(providerName || "there");
    const safeSkillName = escapeHtml(skillName || "your skill");
    const safeFeedback = escapeHtml(feedback || "");
    const statusText = status === "Approved" ? "approved" : "updated";
    const accentColor = status === "Approved" ? "#34d399" : "#f59e0b";
    const intro = status === "Approved"
        ? `Hi ${safeProviderName}, your skill "${safeSkillName}" has been approved and is now visible to seekers on SkillSwap.`
        : `Hi ${safeProviderName}, your skill submission "${safeSkillName}" was not approved.`;
    const bodyCopy = status === "Approved"
        ? "You can now start attracting seekers and showcasing your expertise on SkillSwap."
        : "You can edit the skill and resubmit it with stronger evidence or clearer details for another review.";

    return `
        <div style="font-family:Arial,sans-serif;background:#0f172a;color:#e2e8f0;padding:32px;line-height:1.6;">
            <div style="max-width:620px;margin:0 auto;background:#111827;border:1px solid #243043;border-radius:16px;padding:32px;box-shadow:0 10px 30px rgba(0,0,0,0.25);">
                <h2 style="margin:0 0 16px;color:#ffffff;">${escapeHtml(title)}</h2>
                <p style="margin:0 0 20px;color:#cbd5e1;">${intro}</p>
                <div style="background:#1f2937;border:1px solid #334155;border-radius:12px;padding:16px 20px;margin:0 0 20px;">
                    <p style="margin:0 0 8px;color:#f8fafc;font-weight:700;">Status: <span style="color:${accentColor};">${escapeHtml(statusText)}</span></p>
                    <p style="margin:0;color:#cbd5e1;">${bodyCopy}</p>
                </div>
                ${safeFeedback ? `<div style="background:#0f172a;border:1px solid #243043;border-radius:12px;padding:16px 20px;margin:0 0 20px;">
                    <p style="margin:0 0 8px;color:#f8fafc;font-weight:700;">Admin feedback</p>
                    <p style="margin:0;color:#cbd5e1;">${safeFeedback}</p>
                </div>` : ""}
                <p style="margin:0;color:#94a3b8;font-size:14px;">Thanks for being part of SkillSwap.</p>
            </div>
        </div>
    `;
}

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
    sendEmail,
    buildSkillVerificationEmailHtml
};