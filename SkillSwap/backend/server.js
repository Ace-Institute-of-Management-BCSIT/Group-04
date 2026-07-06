require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const http = require("http");
const crypto = require("crypto"); // ← ADDED: built-in, no install needed
const path = require("path"); // ← ADDED: for serving frontend static files
const { Server } = require("socket.io");

const db = require("./db.js");
const authRoutes = require("./routes/auth");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ====================== SERVE FRONTEND ======================
// backend/server.js  →  ../frontend/HTML, ../frontend/CSS, ../frontend/JS_&_JSON
app.use(express.static(path.join(__dirname, "../frontend/HTML")));
app.use("/CSS", express.static(path.join(__dirname, "../frontend/CSS")));
app.use("/JS_&_JSON", express.static(path.join(__dirname, "../frontend/JS_&_JSON")));

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../SkillSwap/FRONTEND/HTML")));

// Fallback so visiting the bare domain loads home.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/HTML/home.html"));
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error("❌ Missing JWT_SECRET in .env — refusing to start.");
    process.exit(1);
}

// ====================== ENCRYPTION HELPERS ======================
// Uses AES-256-CBC. Key must be 32 bytes (64 hex chars) in .env as ENCRYPTION_KEY.
// Stored format in DB:  <16-byte IV in hex>:<ciphertext in hex>

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
    ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
    : null;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    console.error("❌ Missing or invalid ENCRYPTION_KEY in .env");
    console.error("   Generate one with:  node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
    process.exit(1);
}

function encrypt(plainText) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(storedText) {
    try {
        const [ivHex, encryptedHex] = storedText.split(':');
        if (!ivHex || !encryptedHex) return storedText; // not encrypted, return as-is
        const iv = Buffer.from(ivHex, 'hex');
        const encrypted = Buffer.from(encryptedHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
    } catch {
        return '[encrypted message]'; // graceful fallback for any corrupt rows
    }
}

// ====================== SOCKET.IO REAL-TIME CHAT ======================

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

    socket.join(`user_${socket.userId}`);

    socket.on("send_message", async (data) => {
        const { receiverId, message } = data;
        if (!receiverId || !message || !message.trim()) return;

        // ← CHANGED: encrypt before storing
        const encryptedText = encrypt(message.trim());

        const sql = `
            INSERT INTO messages (sender_id, receiver_id, message_text)
            VALUES (?, ?, ?)
        `;

        try {
            const [result] = await db.query(sql, [socket.userId, receiverId, encryptedText]);

            // Emit plain text to clients — they never see the encrypted form
            const payload = {
                message_id: result.insertId,
                sender_id: socket.userId,
                receiver_id: receiverId,
                message_text: message.trim(), // ← plain text for the live chat UI
                sent_at: new Date().toISOString()
            };

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

// ====================== MIDDLEWARE ======================

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

const verifyAdminToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded.isAdmin) {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        req.adminId = decoded.adminId;
        req.adminUsername = decoded.username;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};

// ====================== AUTH ROUTES ======================

app.use("/api/auth", authRoutes);

// ====================== USER PROFILE ROUTES ======================

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

        // ← CHANGED: decrypt the sidebar preview text
        const conversations = rows.map(row => ({
            ...row,
            last_message: decrypt(row.last_message)
        }));

        return res.json({ success: true, conversations });
    } catch (err) {
        console.error("Conversations Error:", err);
        return res.status(500).json({ success: false, message: "Failed to load conversations" });
    }
});

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

        // ← CHANGED: decrypt every message before sending to the browser
        const messages = rows.map(row => ({
            ...row,
            message_text: decrypt(row.message_text)
        }));

        return res.json({ success: true, messages });
    } catch (err) {
        console.error("Fetch Messages Error:", err);
        return res.status(500).json({ success: false, message: "Failed to load messages" });
    }
});

// ====================== ADMIN ROUTES ======================

app.post("/admin/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Username and password required" });
    }

    const sql = `SELECT admin_id, username FROM admin WHERE username = ? AND password = ?`;

    try {
        const [rows] = await db.query(sql, [username, password]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: "Invalid Username or Password" });
        }

        const admin = rows[0];

        const token = jwt.sign(
            { adminId: admin.admin_id, username: admin.username, isAdmin: true },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.json({
            success: true,
            message: "Login Successful",
            token,
            username: admin.username
        });
    } catch (err) {
        console.error("Admin Login Error:", err);
        return res.status(500).json({ success: false, message: "Database failure occurred." });
    }
});

app.get("/admin/me", verifyAdminToken, (req, res) => {
    return res.json({ success: true, username: req.adminUsername });
});

app.get("/admin/stats", verifyAdminToken, async (req, res) => {
    try {
        const [[userCount]] = await db.query(`SELECT COUNT(*) AS count FROM users`);
        const [[providerCount]] = await db.query(`SELECT COUNT(*) AS count FROM users WHERE role = 'Skill Provider'`);
        const [[skillCount]] = await db.query(`SELECT COUNT(*) AS count FROM skills WHERE status = 'active'`);
        const [[messageCount]] = await db.query(`SELECT COUNT(*) AS count FROM messages`);

        return res.json({
            success: true,
            stats: {
                totalUsers: userCount.count,
                totalProviders: providerCount.count,
                activeSkills: skillCount.count,
                totalMessages: messageCount.count
            }
        });
    } catch (err) {
        console.error("Admin Stats Error:", err);
        return res.status(500).json({ success: false, message: "Failed to load stats" });
    }
});

app.get("/admin/users", verifyAdminToken, async (req, res) => {
    const sql = `
        SELECT user_id, full_name, email, phone, role, location, joined_date
        FROM users
        ORDER BY joined_date DESC
    `;
    try {
        const [rows] = await db.query(sql);
        return res.json({ success: true, users: rows });
    } catch (err) {
        console.error("Admin Users Error:", err);
        return res.status(500).json({ success: false, message: "Failed to load users" });
    }
});

app.delete("/admin/users/:id", verifyAdminToken, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(`DELETE FROM users WHERE user_id = ?`, [id]);
        return res.json({ success: true, message: "User removed" });
    } catch (err) {
        console.error("Admin Delete User Error:", err);
        return res.status(500).json({ success: false, message: "Failed to delete user. They may have related records (skills, bookings, messages)." });
    }
});

app.get("/admin/skills", verifyAdminToken, async (req, res) => {
    const sql = `
        SELECT s.skill_id, s.skill_name, s.category, s.skill_level, s.status,
               s.price_per_session, s.created_at, u.full_name AS provider_name
        FROM skills s
        JOIN users u ON s.provider_id = u.user_id
        ORDER BY s.created_at DESC
    `;
    try {
        const [rows] = await db.query(sql);
        return res.json({ success: true, skills: rows });
    } catch (err) {
        console.error("Admin Skills Error:", err);
        return res.status(500).json({ success: false, message: "Failed to load skills" });
    }
});

app.put("/admin/skills/:id/status", verifyAdminToken, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await db.query(`UPDATE skills SET status = ? WHERE skill_id = ?`, [status, id]);
        return res.json({ success: true, message: "Skill status updated" });
    } catch (err) {
        console.error("Admin Skill Status Error:", err);
        return res.status(500).json({ success: false, message: "Failed to update skill" });
    }
});

// ====================== BOOKING ROUTES ======================

app.post("/api/bookings", verifyToken, async (req, res) => {
    const seekerId = req.userId;
    const { skill_id, booking_date, booking_time } = req.body;
    if (!skill_id || !booking_date || !booking_time) {
        return res.status(400).json({ success: false, message: "Please fill in all fields." });
    }
    try {
        await db.query(
            `INSERT INTO bookings (seeker_id, skill_id, booking_date, booking_time, status) VALUES (?, ?, ?, ?, 'Pending')`,
            [seekerId, skill_id, booking_date, booking_time]
        );
        return res.json({ success: true, message: "Booking request sent!" });
    } catch (err) {
        console.error("Booking Error:", err);
        return res.status(500).json({ success: false, message: "Failed to send request." });
    }
});

app.get("/api/bookings/incoming", verifyToken, async (req, res) => {
    const providerId = req.userId;
    const sql = `
        SELECT b.booking_id, b.booking_date, b.booking_time, b.status,
               s.skill_name,
               u.full_name AS seeker_name, u.avatar AS seeker_avatar, u.user_id AS seeker_id
        FROM bookings b
        JOIN skills s ON b.skill_id = s.skill_id
        JOIN users u ON b.seeker_id = u.user_id
        WHERE s.provider_id = ?
        ORDER BY b.booking_id DESC
    `;
    try {
        const [results] = await db.query(sql, [providerId]);
        return res.json({ success: true, bookings: results });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to fetch requests." });
    }
});

app.get("/api/bookings/my", verifyToken, async (req, res) => {
    const seekerId = req.userId;
    const sql = `
        SELECT b.booking_id, b.booking_date, b.booking_time, b.status,
               s.skill_name,
               u.full_name AS provider_name, u.avatar AS provider_avatar, u.user_id AS provider_id
        FROM bookings b
        JOIN skills s ON b.skill_id = s.skill_id
        JOIN users u ON s.provider_id = u.user_id
        WHERE b.seeker_id = ?
        ORDER BY b.booking_id DESC
    `;
    try {
        const [results] = await db.query(sql, [seekerId]);
        return res.json({ success: true, bookings: results });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to fetch your requests." });
    }
});

app.put("/api/bookings/:id/status", verifyToken, async (req, res) => {
    const providerId = req.userId;
    const bookingId = req.params.id;
    const { status } = req.body;
    if (!['Accepted', 'Cancelled'].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status." });
    }
    const sql = `
        UPDATE bookings b
        JOIN skills s ON b.skill_id = s.skill_id
        SET b.status = ?
        WHERE b.booking_id = ? AND s.provider_id = ?
    `;
    try {
        const [result] = await db.query(sql, [status, bookingId, providerId]);
        if (result.affectedRows === 0) {
            return res.status(403).json({ success: false, message: "Not authorized or booking not found." });
        }
        return res.json({ success: true, message: `Booking ${status}.` });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to update status." });
    }
});

// ====================== START SERVER ======================
// '0.0.0.0' makes it reachable from other devices on the same WiFi/network,
// not just from this machine via localhost.
server.listen(PORT, '0.0.0.0', () => {
    console.log(`SkillSwap Server is running:`);
    console.log(`  Local:   http://localhost:${PORT}`);
    console.log(`  Network: http://<your-ip-address>:${PORT}  (find it with 'ipconfig' or 'ifconfig')`);
});