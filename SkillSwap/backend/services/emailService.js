const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendEmail({ to, subject, html }) {
    if (!to || !subject || !html) {
        throw new Error("sendEmail requires to, subject, and html");
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error("Missing EMAIL_USER or EMAIL_PASS. Set Gmail SMTP credentials in backend/.env before sending email.");
    }

    try {
        console.log("Sending OTP to:", to);
        const result = await transporter.sendMail({
            from: `"SkillSwap" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        });

        console.log(`Email sent to ${to} with subject: ${subject}`);
        return result;
    } catch (error) {
        console.error("Email send error:", {
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