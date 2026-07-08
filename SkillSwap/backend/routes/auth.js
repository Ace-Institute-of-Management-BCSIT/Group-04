const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { sendEmail } = require("../services/emailService");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;
const ENABLE_EMAIL_VERIFICATION = process.env.ENABLE_EMAIL_VERIFICATION === "true";

function generateOTP() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

function buildOtpEmailHtml({ title, otp, intro }) {
    return `
        <div style="font-family:Arial,sans-serif;background:#0f172a;color:#e2e8f0;padding:32px;line-height:1.6;">
            <div style="max-width:560px;margin:0 auto;background:#111827;border:1px solid #243043;border-radius:16px;padding:32px;">
                <h2 style="margin:0 0 16px;color:#ffffff;">${title}</h2>
                <p style="margin:0 0 24px;color:#cbd5e1;">${intro}</p>
                <div style="display:inline-block;background:#1f2937;border:1px solid #334155;border-radius:12px;padding:16px 24px;font-size:28px;font-weight:700;letter-spacing:4px;color:#34d399;">
                    ${otp}
                </div>
                <p style="margin:24px 0 0;color:#94a3b8;font-size:14px;">This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
            </div>
        </div>
    `;
}

async function storeVerificationCode(userId, otp) {
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await db.query(
        `UPDATE users SET verification_code = $1, verification_expires = $2 WHERE user_id = $3`,
        [otp, expires, userId]
    );

    return expires;
}

async function sendOtpEmail({ email, otp, title, intro, subject }) {
    await sendEmail({
        to: email,
        subject,
        html: buildOtpEmailHtml({ title, otp, intro })
    });
}

function buildAuthUser(user) {
    return {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
    };
}

function issueAuthToken(user) {
    return jwt.sign(
        { userId: user.user_id, email: user.email },
        JWT_SECRET,
        { expiresIn: "7d" }
    );
}

async function fetchAuthUserByEmail(email) {
    return db.query(
        `SELECT user_id, full_name, email, password, role, email_verified, logout_count, verification_code, verification_expires FROM users WHERE email = $1`,
        [email]
    );
}

async function sendLoginVerificationCode(user, res) {
    const otp = generateOTP();
    await storeVerificationCode(user.user_id, otp);

    await sendOtpEmail({
        email: user.email,
        otp,
        title: "Verify your SkillSwap login",
        intro: "Use the code below to finish signing in to your SkillSwap account.",
        subject: "Your SkillSwap verification code"
    });

    const payload = {
        success: true,
        requiresVerification: true,
        email: user.email
    };

    if (process.env.NODE_ENV !== "production") {
        payload.otp = otp;
    }

    return res.json(payload);
}

router.post("/register", async (req, res) => {
    const { full_name, email, phone, password, role } = req.body;

    if (!full_name || !email || !phone || !password || !role) {
        return res.status(400).json({ success: false, message: "All fields are required." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        await db.query(
            `INSERT INTO users (full_name, email, phone, password, role, joined_date) VALUES ($1, $2, $3, $4, $5, NOW())`,
            [full_name, email, phone, hashedPassword, role]
        );

        return res.json({ success: true, message: "Signup Successful" });
    } catch (err) {
        console.error("Registration Error:", err);
        return res.status(400).json({ success: false, message: "Email already exists or invalid data entry." });
    }
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    try {
        const { rows } = await fetchAuthUserByEmail(email);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: "Invalid Email or Password" });
        }

        const user = rows[0];
        const passwordMatches = await bcrypt.compare(password, user.password);

        if (!passwordMatches) {
            return res.status(401).json({ success: false, message: "Invalid Email or Password" });
        }

        const needsVerification = ENABLE_EMAIL_VERIFICATION && (!user.email_verified || user.logout_count >= 5);

        if (needsVerification) {
            return await sendLoginVerificationCode(user, res);
        }

        const token = issueAuthToken(user);

        return res.json({
            success: true,
            message: "Login Successful",
            token,
            user: buildAuthUser(user)
        });
    } catch (err) {
        console.error("Login Database Error:", err);
        return res.status(500).json({ success: false, message: "Database failure occurred." });
    }
});

router.post("/verify-otp", async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ success: false, message: "Email and code are required." });
    }

    try {
        const { rows } = await db.query(
            `SELECT user_id, full_name, email, role, verification_code, verification_expires FROM users WHERE email = $1`,
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: "Invalid request." });
        }

        const user = rows[0];

        if (!user.verification_code || user.verification_code !== otp) {
            return res.status(401).json({ success: false, message: "Incorrect verification code." });
        }

        if (new Date() > new Date(user.verification_expires)) {
            return res.status(401).json({ success: false, message: "Code expired. Please log in again." });
        }

        await db.query(
            `UPDATE users SET email_verified = TRUE, logout_count = 0, verification_code = NULL, verification_expires = NULL WHERE user_id = $1`,
            [user.user_id]
        );

        const token = issueAuthToken(user);

        return res.json({
            success: true,
            message: "Login Successful",
            token,
            user: buildAuthUser(user)
        });
    } catch (err) {
        console.error("OTP Verify Error:", err);
        return res.status(500).json({ success: false, message: "Verification failed." });
    }
});

router.post("/resend-otp", async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required." });
    }

    try {
        const { rows } = await db.query(
            `SELECT user_id, email FROM users WHERE email = $1`,
            [email]
        );

        if (rows.length > 0) {
            const user = rows[0];
            const otp = generateOTP();

            await storeVerificationCode(user.user_id, otp);

            await sendOtpEmail({
                email: user.email,
                otp,
                title: "Your SkillSwap verification code",
                intro: "Use the code below to verify your SkillSwap login.",
                subject: "Your SkillSwap verification code"
            });
        }

        return res.json({ success: true });
    } catch (err) {
        console.error("Resend OTP Error:", err);
        return res.status(500).json({ success: false, message: "Failed to resend code." });
    }
});

router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required." });
    }

    try {
        const { rows } = await db.query(
            `SELECT user_id, email FROM users WHERE email = $1`,
            [email]
        );

        if (rows.length > 0) {
            const user = rows[0];
            const otp = generateOTP();

            await storeVerificationCode(user.user_id, otp);

            await sendOtpEmail({
                email: user.email,
                otp,
                title: "Reset your SkillSwap password",
                intro: "Use the code below to reset your SkillSwap password.",
                subject: "Your SkillSwap password reset code"
            });
        }

        return res.json({
            success: true,
            message: "If an account exists, a reset code has been sent."
        });
    } catch (err) {
        console.error("Forgot Password Error:", err);
        return res.status(500).json({ success: false, message: "Could not process password reset." });
    }
});

router.post("/reset-password", async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ success: false, message: "Email, reset code, and a new password (6+ chars) are required." });
    }

    try {
        const { rows } = await db.query(
            `SELECT user_id, verification_code, verification_expires FROM users WHERE email = $1`,
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: "Invalid reset code or expired code." });
        }

        const user = rows[0];

        if (!user.verification_code || user.verification_code !== otp) {
            return res.status(401).json({ success: false, message: "Invalid reset code or expired code." });
        }

        if (new Date() > new Date(user.verification_expires)) {
            return res.status(401).json({ success: false, message: "Invalid reset code or expired code." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

        await db.query(
            `UPDATE users SET password = $1, verification_code = NULL, verification_expires = NULL WHERE user_id = $2`,
            [hashedPassword, user.user_id]
        );

        return res.json({ success: true });
    } catch (err) {
        console.error("Reset Password Error:", err);
        return res.status(500).json({ success: false, message: "Could not reset password." });
    }
});

router.post("/logout", verifyToken, async (req, res) => {
    try {
        await db.query(`UPDATE users SET logout_count = logout_count + 1 WHERE user_id = $1`, [req.userId]);
        return res.json({ success: true, message: "Logged out" });
    } catch (err) {
        console.error("Logout Error:", err);
        return res.status(500).json({ success: false, message: "Logout tracking failed" });
    }
});

module.exports = router;
