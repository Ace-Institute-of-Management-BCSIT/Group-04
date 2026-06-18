const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const db = require("./db"); // Successfully imports pool.promise()

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const PORT = 5000;
const JWT_SECRET = "skillswap_jwt_secret_key_2026_change_in_production";

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "No token provided"
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};

// ====================== AUTH ROUTES ======================

// Async/Await Registration Route
app.post("/api/auth/register", async (req, res) => {
    const { full_name, email, phone, password, role } = req.body;

    const sql = `
        INSERT INTO users 
        (full_name, email, phone, password, role, joined_date)
        VALUES (?, ?, ?, ?, ?, NOW())
    `;

    try {
        await db.query(sql, [full_name, email, phone, password, role]);
        return res.json({ success: true, message: "Signup Successful" });
    } catch (err) {
        console.error("Registration Error:", err);
        return res.status(400).json({
            success: false,
            message: "Email already exists or invalid data entry."
        });
    }
});

// Async/Await Login Route
app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;

    const sql = `
        SELECT user_id, full_name, email, role 
        FROM users 
        WHERE email = ? AND password = ?
    `;

    try {
        const [rows] = await db.query(sql, [email, password]);

        if (rows.length > 0) {
            const user = rows[0];
            
            const token = jwt.sign(
                { userId: user.user_id, email: user.email },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            return res.json({
                success: true,
                message: "Login Successful",
                token: token,
                user: {
                    user_id: user.user_id,
                    full_name: user.full_name,
                    email: user.email,
                    role: user.role
                }
            });
        } else {
            return res.status(401).json({ success: false, message: "Invalid Email or Password" });
        }
    } catch (err) {
        console.error("Login Database Error:", err);
        return res.status(500).json({ success: false, message: "Database failure occurred." });
    }
});

// ====================== USER PROFILE ROUTES ======================

// Fetch profile data for current user (CRITICAL FIX)
app.get("/api/users/me", verifyToken, async (req, res) => {
    const userId = req.userId;

    const sql = `
        SELECT user_id, full_name, email, avatar, bio, location, rating, 
               total_reviews, total_sessions, role, joined_date
        FROM users WHERE user_id = ?
    `;

    try {
        const [userRows] = await db.query(sql, [userId]);

        if (userRows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const user = userRows[0];

        // Fetch user matching skills
        const skillsSql = `
            SELECT user_skill_id as id, skill_name as name, skill_level as level, 
                   progress, sessions_completed 
            FROM user_skills WHERE user_id = ?
        `;
        const [skills] = await db.query(skillsSql, [userId]);

        return res.json({
            success: true,
            user: {
                id: user.user_id,
                name: user.full_name,
                email: user.email,
                avatar: user.avatar || `https://i.pravatar.cc/300?u=${user.user_id}`,
                bio: user.bio || "",
                location: user.location || "",
                rating: user.rating || 4.8,
                reviews: user.total_reviews || 0,
                sessions: user.total_sessions || 0,
                role: user.role,
                joined: user.joined_date ? new Date(user.joined_date).toLocaleString('default', { month: 'long', year: 'numeric' }) : '2026',
                teaching: skills || [],
                learning: []
            }
        });
    } catch (err) {
        console.error("Fetch Profile Error:", err);
        return res.status(500).json({ success: false, message: "Database fetch failure." });
    }
});

// Get Public Profile by ID
app.get("/api/users/profile/:id", async (req, res) => {
    const userId = req.params.id;
    const sql = `SELECT user_id, full_name, email, avatar, bio, location, role FROM users WHERE user_id = ?`;
    
    try {
        const [rows] = await db.query(sql, [userId]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: "User not found" });
        return res.json({ success: true, user: rows[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Database Error" });
    }
});

// Update Profile
app.put("/api/users/me", verifyToken, async (req, res) => {
    const userId = req.userId;
    const { full_name, bio, location, avatar } = req.body;

    const sql = `
        UPDATE users 
        SET full_name = ?, bio = ?, location = ?, avatar = ?
        WHERE user_id = ?
    `;

    try {
        await db.query(sql, [full_name, bio, location, avatar, userId]);
        return res.json({ success: true, message: "Profile updated successfully" });
    } catch (err) {
        console.error("Update Profile Error:", err);
        return res.status(500).json({ success: false, message: "Update failed" });
    }
});

app.listen(PORT, () => {
    console.log(`✅ SkillSwap Server executing cleanly on http://localhost:${PORT}`);
});