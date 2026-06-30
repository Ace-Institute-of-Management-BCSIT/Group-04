const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const http = require("http");
const path = require("path"); // Added for static file routing path management
const { Server } = require("socket.io");

const db = require("./db");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static frontend files if you want node to deliver pages automatically
// Replace "../frontend" with your actual path if different
app.use(express.static(path.join(__dirname, "../frontend")));

const PORT = 5000;
const JWT_SECRET = "skillswap_jwt_secret_key_2026_change_in_production";

// ====================== SOCKET.IO REAL-TIME CHAT ======================

// Authenticate every socket connection using the same JWT used for REST calls
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.userId = decoded.userId;
        next();
    } catch (err) {
        next(new Error("Invalid or expired token"));
    }
});

io.on("connection", (socket) => {
    console.log(`User ${socket.userId} connected (${socket.id})`);

    // Each user has a permanent personal room. Anyone messaging them
    // emits into this room, so it doesn't matter which chat window
    // (if any) they currently have open.
    socket.join(`user_${socket.userId}`);

    socket.on("send_message", async (data) => {
        const { receiverId, message } = data;
        if (!receiverId || !message || !message.trim()) return;

        const sql = `
            INSERT INTO messages (sender_id, receiver_id, message_text)
            VALUES (?, ?, ?)
        `;

        try {
            const [result] = await db.query(sql, [socket.userId, receiverId, message.trim()]);

            const payload = {
                message_id: result.insertId,
                sender_id: socket.userId,
                receiver_id: receiverId,
                message_text: message.trim(),
                sent_at: new Date().toISOString()
            };

            // Deliver to the recipient if they're online, and echo back
            // to the sender (e.g. if they have multiple tabs open)
            io.to(`user_${receiverId}`).emit("receive_message", payload);
            io.to(`user_${socket.userId}`).emit("receive_message", payload);
        } catch (err) {
            console.error("Send Message Error:", err);
            socket.emit("message_error", { message: "Failed to send message" });
        }
    });

    socket.on("disconnect", () => {
        console.log(`User ${socket.userId} disconnected (${socket.id})`);
    });
});

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

// Get Current Logged-in User Info
app.get("/api/users/me", verifyToken, async (req, res) => {
    const userId = req.userId;

    const sql = `
        SELECT user_id, full_name, email, phone, avatar, bio, location, rating, 
               total_reviews, total_sessions, role, joined_date
        FROM users 
        WHERE user_id = ?
    `;

    try {
        const [userRows] = await db.query(sql, [userId]);

        if (userRows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const user = userRows[0];

        res.json({
            success: true,
            user: {
                id: user.user_id,
                name: user.full_name,
                email: user.email,
                phone: user.phone || "",
                avatar: user.avatar,
                bio: user.bio || "No bio added yet.",
                location: user.location || "Kathmandu, Nepal",
                rating: user.rating || 4.8,
                reviews: user.total_reviews || 0,
                sessions: user.total_sessions || 0,
                role: user.role,
                joined: user.joined_date ? new Date(user.joined_date).toLocaleString('default', { month: 'long', year: 'numeric' }) : '2026'
            }
        });
    } catch (err) {
        console.error("Fetch /me Error:", err);
        return res.status(500).json({
            success: false,
            message: "Database fetch failure. Some columns may be missing."
        });
    }
});

// Public Profile by ID — includes stats for the profile page
app.get("/api/users/profile/:id", async (req, res) => {
    const userId = req.params.id;
    const sql = `
        SELECT user_id, full_name, avatar, bio, location, role,
               rating, total_reviews, total_sessions, joined_date
        FROM users 
        WHERE user_id = ?
    `;
    try {
        const [rows] = await db.query(sql, [userId]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: "User not found" });

        const user = rows[0];
        return res.json({
            success: true,
            user: {
                id: user.user_id,
                name: user.full_name,
                avatar: user.avatar,
                bio: user.bio || "No bio added yet.",
                location: user.location || "Kathmandu, Nepal",
                role: user.role,
                rating: user.rating || 4.8,
                reviews: user.total_reviews || 0,
                sessions: user.total_sessions || 0,
                joined: user.joined_date
                    ? new Date(user.joined_date).toLocaleString('default', { month: 'long', year: 'numeric' })
                    : '2026'
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Database Error" });
    }
});

// Update Profile Details (Including Phone Number)
app.put("/api/users/me", verifyToken, async (req, res) => {
    const userId = req.userId;
    const { full_name, bio, location, avatar, phone } = req.body;

    const sql = `
        UPDATE users 
        SET full_name = ?, bio = ?, location = ?, avatar = ?, phone = ?
        WHERE user_id = ?
    `;

    try {
        await db.query(sql, [full_name, bio, location, avatar, phone, userId]);
        return res.json({ success: true, message: "Profile updated successfully" });
    } catch (err) {
        console.error("Update Profile Error:", err);
        return res.status(500).json({ success: false, message: "Update failed" });
    }
});

// ====================== SKILL MANAGEMENT ======================

// Add Skill by Provider
app.post("/api/users/skills", verifyToken, async (req, res) => {
    const userId = req.userId;
    const { skill_name, skill_level, category, description, price_per_session, availability } = req.body;

    const sql = `
        INSERT INTO skills 
        (provider_id, skill_name, category, description, skill_level, 
         price_per_session, location, availability)
        VALUES (?, ?, ?, ?, ?, ?, 'Kathmandu', ?)
    `;

    try {
        await db.query(sql, [
            userId,
            skill_name,
            category || 'General',
            description,
            skill_level || 'Intermediate',
            price_per_session || 0,
            availability || 'Flexible'
        ]);
        return res.json({ success: true, message: "Skill added successfully!" });
    } catch (err) {
        console.error("Add Skill Error:", err);
        return res.status(500).json({ success: false, message: "Failed to add skill" });
    }
});

// Get skills for the logged-in provider (their own dashboard)
app.get("/api/users/skills", verifyToken, async (req, res) => {
    const userId = req.userId;
    const sql = `SELECT * FROM skills WHERE provider_id = ? ORDER BY created_at DESC`;
    try {
        const [results] = await db.query(sql, [userId]);
        return res.json({ success: true, skills: results });
    } catch (err) {
        console.error("Get Skills Error:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch skills" });
    }
});

// Public route — anyone can view a specific provider's active skills
app.get("/api/users/:id/skills", async (req, res) => {
    const providerId = req.params.id;
    const sql = `
        SELECT skill_id, skill_name, category, description, skill_level, availability
        FROM skills 
        WHERE provider_id = ? AND status = 'active'
        ORDER BY created_at DESC
    `;
    try {
        const [results] = await db.query(sql, [providerId]);
        return res.json({ success: true, skills: results });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to fetch skills" });
    }
});

// Get All Active Skills for "Find Skills" Page
app.get("/api/skills", async (req, res) => {
    const sql = `
        SELECT s.skill_id, s.skill_name, s.category, s.description, 
               s.skill_level, s.price_per_session, s.location, s.availability,
               u.full_name as provider_name, u.avatar, u.user_id as provider_id,
               u.bio as provider_bio, u.rating, u.total_reviews
        FROM skills s
        JOIN users u ON s.provider_id = u.user_id
        WHERE s.status = 'active'
        ORDER BY s.created_at DESC
    `;

    try {
        const [results] = await db.query(sql);
        return res.json({ success: true, skills: results });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Database error" });
    }
});

// ====================== MESSAGING ROUTES ======================

// List of conversations for the sidebar — one row per person you've
// exchanged at least one message with, showing the latest message.
app.get("/api/messages/conversations", verifyToken, async (req, res) => {
    const userId = req.userId;

    const sql = `
        SELECT u.user_id, u.full_name, u.avatar,
               m.message_text AS last_message, m.sent_at AS last_time
        FROM users u
        JOIN (
            SELECT 
                CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS other_id,
                MAX(message_id) AS last_msg_id
            FROM messages
            WHERE sender_id = ? OR receiver_id = ?
            GROUP BY other_id
        ) latest ON u.user_id = latest.other_id
        JOIN messages m ON m.message_id = latest.last_msg_id
        ORDER BY m.sent_at DESC
    `;

    try {
        const [rows] = await db.query(sql, [userId, userId, userId]);
        return res.json({ success: true, conversations: rows });
    } catch (err) {
        console.error("Conversations Error:", err);
        return res.status(500).json({ success: false, message: "Failed to load conversations" });
    }
});

// Full message history with one specific other user
app.get("/api/messages/:otherUserId", verifyToken, async (req, res) => {
    const userId = req.userId;
    const otherUserId = req.params.otherUserId;

    const sql = `
        SELECT message_id, sender_id, receiver_id, message_text, sent_at
        FROM messages
        WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
        ORDER BY sent_at ASC
    `;

    try {
        const [rows] = await db.query(sql, [userId, otherUserId, otherUserId, userId]);
        return res.json({ success: true, messages: rows });
    } catch (err) {
        console.error("Fetch Messages Error:", err);
        return res.status(500).json({ success: false, message: "Failed to load messages" });
    }
});

// ====================== ADMIN PANEL LOGINS ======================

// Fixed async/await implementation for Admin login
app.post("/admin/login", async (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT * FROM admin WHERE username=? AND password=?";

    try {
        const [rows] = await db.query(sql, [username, password]);

        if (rows.length > 0) {
            return res.json({
                success: true,
                username: rows[0].username
            });
        } else {
            return res.json({
                success: false,
                message: "Invalid Admin Credentials"
            });
        }
    } catch (err) {
        console.error("Admin Login Error:", err);
        return res.status(500).json({
            success: false,
            message: "Database failure occurred."
        });
    }
});

server.listen(PORT, () => {
    console.log(`✅ SkillSwap Server executing cleanly on http://localhost:${PORT}`);
});