const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health Check Route
app.get("/", (req, res) => {
    res.json({ 
        status: "ok", 
        message: "✅ SkillSwap Backend is running!" 
    });
});

// ====================== SIGNUP ======================
app.post("/signup", async (req, res) => {
    const { full_name, email, phone, password, role } = req.body;

    if (!full_name || !email || !password) {
        return res.status(400).json({ message: "Full name, email and password are required" });
    }

    try {
        // Check if email exists
        const [existing] = await db.execute(
            "SELECT user_id FROM users WHERE email = ?", 
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const sql = `
            INSERT INTO users (full_name, email, phone, password, role) 
            VALUES (?, ?, ?, ?, ?)
        `;

        const [result] = await db.execute(sql, [
            full_name, 
            email, 
            phone || null, 
            password, 
            role || 'Both'
        ]);

        // Create profile entry
        await db.execute("INSERT INTO profiles (user_id) VALUES (?)", [result.insertId]);

        console.log(`New user registered: ${email}`);
        res.json({ message: "Signup Successful" });

    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ message: "Server error during signup" });
    }
});

// ====================== LOGIN ======================
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    try {
        const [users] = await db.execute(
            "SELECT user_id, full_name, email, role FROM users WHERE email = ? AND password = ?", 
            [email, password]
        );

        if (users.length === 0) {
            return res.json({ 
                success: false, 
                message: "Invalid Email or Password" 
            });
        }

        const user = users[0];

        console.log(`User logged in: ${email}`);

        res.json({
            success: true,
            message: "Login Successful",
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error during login" 
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 SkillSwap Server is running on http://localhost:${PORT}`);
});