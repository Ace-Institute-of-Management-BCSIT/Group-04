const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../db");
const nodemailer = require("nodemailer");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    socketTimeout: 10000,
    family: 4
});

function generateOTP() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOTPEmail(toEmail, otp) {
    await transporter.sendMail({
        from: `"SkillSwap" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: "Your SkillSwap verification code",
        html: `<p>Your verification code is:</p><h2>${otp}</h2><p>This code expires in 10 minutes.</p>`
    });
}

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};

router.post("/register", async (req, res) => {
    const { full_name, email, phone, password, role } = req.body;

    if (!full_name || !email || !phone || !password || !role) {
        return res.status(400).json({ success: false, message: "All fields are required." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

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
        const { rows } = await db.query(
            `SELECT user_id, full_name, email, password, role, email_verified, logout_count FROM users WHERE email = $1`,
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: "Invalid Email or Password" });
        }

        const user = rows[0];
        const passwordMatches = await bcrypt.compare(password, user.password);

        if (!passwordMatches) {
            return res.status(401).json({ success: false, message: "Invalid Email or Password" });
        }

        const needsVerification = !user.email_verified || user.logout_count >= 5;

        if (needsVerification) {
            const otp = generateOTP();
            const expires = new Date(Date.now() + 10 * 60 * 1000);

            await db.query(
                `UPDATE users SET verification_code = $1, verification_expires = $2 WHERE user_id = $3`,
                [otp, expires, user.user_id]
            );

            await sendOTPEmail(user.email, otp);

            return res.json({
                success: true,
                requiresVerification: true,
                email: user.email,
                message: "Verification code sent to your email."
            });
        }

        const token = jwt.sign(
            { userId: user.user_id, email: user.email },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.json({
            success: true,
            message: "Login Successful",
            token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
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
            `UPDATE users SET email_verified = 1, logout_count = 0, verification_code = NULL, verification_expires = NULL WHERE user_id = $1`,
            [user.user_id]
        );

        const token = jwt.sign(
            { userId: user.user_id, email: user.email },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.json({
            success: true,
            message: "Login Successful",
            token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
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

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const user = rows[0];
        const otp = generateOTP();
        const expires = new Date(Date.now() + 10 * 60 * 1000);

        await db.query(
            `UPDATE users SET verification_code = $1, verification_expires = $2 WHERE user_id = $3`,
            [otp, expires, user.user_id]
        );

        await sendOTPEmail(user.email, otp);

        return res.json({ success: true, message: "Verification code resent." });
    } catch (err) {
        console.error("Resend OTP Error:", err);
        return res.status(500).json({ success: false, message: "Failed to resend code." });
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
