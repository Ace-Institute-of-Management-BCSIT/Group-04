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
const { verifyToken, verifyAdminToken } = require("./middleware/auth");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ====================== SERVE FRONTEND ======================
// backend/server.js  →  ../FRONTEND/HTML, ../FRONTEND/CSS, ../FRONTEND/JS_&_JSON
app.use(express.static(path.join(__dirname, '../FRONTEND/HTML')));
app.use("/CSS", express.static(path.join(__dirname, "../FRONTEND/CSS")));
app.use("/JS_&_JSON", express.static(path.join(__dirname, "../FRONTEND/JS_&_JSON")));

// Fallback so visiting the bare domain loads home.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../FRONTEND/HTML/home.html"));
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error("❌ Missing JWT_SECRET in .env — refusing to start.");
    process.exit(1);
}

async function ensureBookingSessionColumns() {
    const statements = [
        `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS session_status VARCHAR(20) DEFAULT 'Not Started'`,
        `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS session_token VARCHAR(64)`,
        `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS started_at TIMESTAMP`,
        `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP`
    ];

    try {
        for (const sql of statements) {
            await db.query(sql);
        }
        console.log("Booking session columns ready");
    } catch (err) {
        console.error("Booking schema update failed:", err.message);
    }
}

function generateSessionToken() {
    return crypto.randomBytes(24).toString("hex");
}

ensureBookingSessionColumns();

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
            VALUES ($1, $2, $3)
            RETURNING message_id
        `;

        try {
            const { rows } = await db.query(sql, [socket.userId, receiverId, encryptedText]);

            // Emit plain text to clients — they never see the encrypted form
            const payload = {
                message_id: rows[0].message_id,
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

// ====================== AUTH ROUTES ======================

app.use("/api/auth", authRoutes);

// ====================== USER PROFILE ROUTES ======================

app.get("/api/users/me", verifyToken, async (req, res) => {
    const userId = req.userId;

    const sql = `
        SELECT user_id, full_name, email, phone, avatar, bio, location, rating, 
               total_reviews, total_sessions, role, joined_date
        FROM users 
        WHERE user_id = $1
    `;
    
    try {
        const { rows: userRows } = await db.query(sql, [userId]);

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
        WHERE user_id = $1
    `;
    try {
        const { rows } = await db.query(sql, [userId]);
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

const VALID_PROFILE_LOCATIONS = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Hetauda'];

function normalizeProfileLocation(location) {
    if (typeof location !== 'string') return 'Kathmandu';
    const normalized = location.trim();
    return VALID_PROFILE_LOCATIONS.includes(normalized) ? normalized : 'Kathmandu';
}

app.put("/api/users/me", verifyToken, async (req, res) => {
    const userId = req.userId;
    const { full_name, bio, location, avatar, phone } = req.body;
    const finalLocation = normalizeProfileLocation(location);

    const sql = `
        UPDATE users 
        SET full_name = $1, bio = $2, location = $3, avatar = $4, phone = $5
        WHERE user_id = $6
    `;

    try {
        await db.query(sql, [full_name, bio, finalLocation, avatar, phone, userId]);
        return res.json({ success: true, message: "Profile updated successfully" });
    } catch (err) {
        console.error("Update Profile Error:", err);
        return res.status(500).json({ success: false, message: "Update failed" });
    }
});

// ====================== SKILL MANAGEMENT ======================

const VALID_SKILL_CATEGORIES = ['Development', 'Design', 'Marketing', 'Business', 'Language', 'Music', 'Cooking', 'Fitness', 'Other'];

function normalizeSkillCategory(category) {
    if (typeof category !== 'string') return 'Other';
    const normalized = category.trim();
    return VALID_SKILL_CATEGORIES.includes(normalized) ? normalized : 'Other';
}

app.post("/api/users/skills", verifyToken, async (req, res) => {
    const userId = req.userId;
    const { skill_name, skill_level, category, description, price_per_session, availability } = req.body;
    const finalCategory = normalizeSkillCategory(category);

    const sql = `
        INSERT INTO skills 
        (provider_id, skill_name, category, description, skill_level, 
         price_per_session, availability)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    try {
        await db.query(sql, [
            userId,
            skill_name,
            finalCategory,
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
    const sql = `SELECT * FROM skills WHERE provider_id = $1 ORDER BY created_at DESC`;
    try {
        const { rows: results } = await db.query(sql, [userId]);
        return res.json({ success: true, skills: results });
    } catch (err) {
        console.error("Get Skills Error:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch skills" });
    }
});

app.put("/api/users/skills/:id", verifyToken, async (req, res) => {
    const userId = req.userId;
    const skillId = req.params.id;
    const { skill_name, skill_level, category, description, price_per_session, availability } = req.body;
    const finalCategory = normalizeSkillCategory(category);

    const sql = `
        UPDATE skills 
        SET skill_name = $1, skill_level = $2, category = $3, 
            description = $4, price_per_session = $5, availability = $6
        WHERE skill_id = $7 AND provider_id = $8
        RETURNING skill_id
    `;

    try {
        const { rows } = await db.query(sql, [
            skill_name,
            skill_level || 'Intermediate',
            finalCategory,
            description,
            price_per_session || 0,
            availability || 'Flexible',
            skillId,
            userId
        ]);

        if (rows.length === 0) {
            return res.status(403).json({ success: false, message: "Skill not found or not authorized to edit" });
        }

        return res.json({ success: true, message: "Skill updated successfully!" });
    } catch (err) {
        console.error("Update Skill Error:", err);
        return res.status(500).json({ success: false, message: "Failed to update skill" });
    }
});

app.delete("/api/users/skills/:id", verifyToken, async (req, res) => {
    const userId = req.userId;
    const skillId = req.params.id;

    const sql = `DELETE FROM skills WHERE skill_id = $1 AND provider_id = $2 RETURNING skill_id`;

    try {
        const { rows } = await db.query(sql, [skillId, userId]);

        if (rows.length === 0) {
            return res.status(403).json({ success: false, message: "Skill not found or not authorized to delete" });
        }

        return res.json({ success: true, message: "Skill deleted successfully!" });
    } catch (err) {
        console.error("Delete Skill Error:", err);
        return res.status(500).json({ success: false, message: "Failed to delete skill" });
    }
});


app.get("/api/users/:id/skills", async (req, res) => {
    const providerId = req.params.id;
    const sql = `
        SELECT s.skill_id, s.skill_name, s.category, s.description, s.skill_level, s.availability,
               u.location
        FROM skills s
        JOIN users u ON s.provider_id = u.user_id
        WHERE s.provider_id = $1 AND s.status = 'active'
        ORDER BY s.created_at DESC
    `;
    try {
        const { rows: results } = await db.query(sql, [providerId]);
        const normalizedSkills = results.map(skill => ({
            ...skill,
            location: normalizeProfileLocation(skill.location)
        }));
        return res.json({ success: true, skills: normalizedSkills });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to fetch skills" });
    }
});

app.post("/api/reviews", verifyToken, async (req, res) => {
    const seekerId = req.userId;
    const { booking_id, rating, comment } = req.body;

    if (!booking_id) {
        return res.status(400).json({ success: false, message: "Booking ID is required." });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: "Rating must be an integer from 1 to 5." });
    }

    try {
        const { rows: bookingRows } = await db.query(`
            SELECT b.booking_id, b.status, b.seeker_id, s.provider_id
            FROM bookings b
            JOIN skills s ON s.skill_id = b.skill_id
            WHERE b.booking_id = $1
        `, [booking_id]);

        if (bookingRows.length === 0) {
            return res.status(404).json({ success: false, message: "Booking not found." });
        }

        const booking = bookingRows[0];
        if (booking.seeker_id !== seekerId) {
            return res.status(403).json({ success: false, message: "Only the booking seeker can leave a review." });
        }

        if (booking.status !== 'Completed') {
            return res.status(400).json({ success: false, message: "Only completed sessions can be reviewed." });
        }

        const { rows: reviewRows } = await db.query(`
            SELECT review_id FROM reviews WHERE booking_id = $1
        `, [booking_id]);

        if (reviewRows.length > 0) {
            return res.status(400).json({ success: false, message: "A review already exists for this booking." });
        }

        await db.query(`
            INSERT INTO reviews (booking_id, rating, comment)
            VALUES ($1, $2, $3)
        `, [booking_id, rating, comment || null]);

        const { rows: reviewStatsRows } = await db.query(`
            SELECT COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0.00) AS avg_rating,
                   COALESCE(COUNT(*), 0) AS review_count
            FROM reviews r
            JOIN bookings b ON b.booking_id = r.booking_id
            JOIN skills s ON s.skill_id = b.skill_id
            WHERE s.provider_id = $1
        `, [booking.provider_id]);

        const reviewStats = reviewStatsRows[0] || { avg_rating: 0.00, review_count: 0 };

        await db.query(`
            UPDATE users
            SET rating = $1, total_reviews = $2
            WHERE user_id = $3
        `, [reviewStats.avg_rating, reviewStats.review_count, booking.provider_id]);

        return res.json({ success: true, message: "Review submitted" });
    } catch (err) {
        console.error("Review submission error:", err);
        return res.status(500).json({ success: false, message: "Failed to submit review." });
    }
});

app.get("/api/users/:id/reviews", async (req, res) => {
    const providerId = req.params.id;
    const sql = `
        SELECT r.review_id, r.rating, r.comment,
               u.full_name AS seeker_name, u.avatar AS seeker_avatar,
               s.skill_name, b.booking_date
        FROM reviews r
        JOIN bookings b ON b.booking_id = r.booking_id
        JOIN skills s ON s.skill_id = b.skill_id
        JOIN users u ON u.user_id = b.seeker_id
        WHERE s.provider_id = $1
        ORDER BY b.booking_date DESC, r.review_id DESC
    `;
    try {
        const { rows: reviews } = await db.query(sql, [providerId]);
        return res.json({ success: true, reviews });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to fetch reviews" });
    }
});

app.get("/api/skills", async (req, res) => {
    const sql = `
        SELECT s.skill_id, s.skill_name, s.category, s.description, 
               s.skill_level, s.price_per_session, s.availability,
               u.full_name as provider_name, u.avatar, u.user_id as provider_id,
               u.bio as provider_bio, u.rating, u.total_reviews, u.location
        FROM skills s
        JOIN users u ON s.provider_id = u.user_id
        WHERE s.status = 'active'
        ORDER BY s.created_at DESC
    `;

    try {
        const { rows: results } = await db.query(sql);
        const normalizedSkills = results.map(skill => ({
            ...skill,
            location: normalizeProfileLocation(skill.location)
        }));
        return res.json({ success: true, skills: normalizedSkills });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Database error" });
    }
});

app.get("/api/skills/random", async (req, res) => {
    const category = req.query.category;
    let sql = `
        SELECT s.skill_id, s.skill_name, s.category, s.description, 
               s.skill_level, s.price_per_session, s.availability,
               u.full_name as provider_name, u.avatar, u.user_id as provider_id,
               u.bio as provider_bio, u.rating, u.total_reviews, u.location
        FROM skills s
        JOIN users u ON s.provider_id = u.user_id
        WHERE s.status = 'active'
    `;
    const params = [];

    if (category && category !== 'all') {
        sql += ` AND s.category = $1`;
        params.push(category);
    }

    sql += ` ORDER BY RANDOM() LIMIT 3`;

    try {
        const { rows: results } = await db.query(sql, params);
        const normalizedSkills = results.map(skill => ({
            ...skill,
            location: normalizeProfileLocation(skill.location)
        }));
        return res.json({ success: true, skills: normalizedSkills });
    } catch (err) {
        console.error("Random Skills Error:", err);
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
                CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END AS other_id,
                MAX(message_id) AS last_msg_id
            FROM messages
            WHERE sender_id = $2 OR receiver_id = $3
            GROUP BY other_id
        ) latest ON u.user_id = latest.other_id
        JOIN messages m ON m.message_id = latest.last_msg_id
        ORDER BY m.sent_at DESC
    `;

    try {
        const { rows } = await db.query(sql, [userId, userId, userId]);

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
        WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $3 AND receiver_id = $4)
        ORDER BY sent_at ASC
    `;

    try {
        const { rows } = await db.query(sql, [userId, otherUserId, otherUserId, userId]);

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

    const sql = `SELECT admin_id, username FROM admin WHERE username = $1 AND password = $2`;

    try {
        const { rows } = await db.query(sql, [username, password]);

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
        const { rows: userCountRows } = await db.query(`SELECT COUNT(*) AS count FROM users`);
        const { rows: providerCountRows } = await db.query(`SELECT COUNT(*) AS count FROM users WHERE role = 'Skill Provider'`);
        const { rows: skillCountRows } = await db.query(`SELECT COUNT(*) AS count FROM skills WHERE status = 'active'`);
        const { rows: messageCountRows } = await db.query(`SELECT COUNT(*) AS count FROM messages`);

        return res.json({
            success: true,
            stats: {
                totalUsers: userCountRows[0].count,
                totalProviders: providerCountRows[0].count,
                activeSkills: skillCountRows[0].count,
                totalMessages: messageCountRows[0].count
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
        const { rows } = await db.query(sql);
        return res.json({ success: true, users: rows });
    } catch (err) {
        console.error("Admin Users Error:", err);
        return res.status(500).json({ success: false, message: "Failed to load users" });
    }
});

app.delete("/admin/users/:id", verifyAdminToken, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(`DELETE FROM users WHERE user_id = $1`, [id]);
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
        const { rows } = await db.query(sql);
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
        await db.query(`UPDATE skills SET status = $1 WHERE skill_id = $2`, [status, id]);
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
            `INSERT INTO bookings (seeker_id, skill_id, booking_date, booking_time, status) VALUES ($1, $2, $3, $4, 'Pending')`,
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
        SELECT b.booking_id, b.booking_date, b.booking_time, b.status, b.session_status, b.session_token, b.started_at, b.completed_at,
               s.skill_name,
               u.full_name AS seeker_name, u.avatar AS seeker_avatar, u.user_id AS seeker_id
        FROM bookings b
        JOIN skills s ON b.skill_id = s.skill_id
        JOIN users u ON b.seeker_id = u.user_id
        WHERE s.provider_id = $1
        ORDER BY b.booking_id DESC
    `;
    try {
        const { rows: results } = await db.query(sql, [providerId]);
        return res.json({ success: true, bookings: results });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to fetch requests." });
    }
});

app.get("/api/bookings/my", verifyToken, async (req, res) => {
    const seekerId = req.userId;
    const sql = `
        SELECT b.booking_id, b.booking_date, b.booking_time, b.status, b.session_status, b.session_token, b.started_at, b.completed_at,
               s.skill_name,
               u.full_name AS provider_name, u.avatar AS provider_avatar, u.user_id AS provider_id,
               CASE WHEN r.review_id IS NULL THEN false ELSE true END AS has_review
        FROM bookings b
        JOIN skills s ON b.skill_id = s.skill_id
        JOIN users u ON s.provider_id = u.user_id
        LEFT JOIN reviews r ON r.booking_id = b.booking_id
        WHERE b.seeker_id = $1
        ORDER BY b.booking_id DESC
    `;
    try {
        const { rows: results } = await db.query(sql, [seekerId]);
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
        SET status = $1
        FROM skills s
        WHERE b.skill_id = s.skill_id
        AND b.booking_id = $2
        AND s.provider_id = $3
    `;
    try {
        const { rowCount } = await db.query(sql, [status, bookingId, providerId]);
        if (rowCount === 0) {
            return res.status(403).json({ success: false, message: "Not authorized or booking not found." });
        }
        return res.json({ success: true, message: `Booking ${status}.` });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to update status." });
    }
});

app.post("/api/bookings/:id/session-control", async (req, res) => {
    const bookingId = req.params.id;
    const { action, token } = req.body;
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.split(' ')[1];
    const jwtToken = bearerToken || req.query?.token || token;

    let userId = null;
    if (jwtToken) {
        try {
            const decoded = jwt.verify(jwtToken, JWT_SECRET);
            userId = decoded.userId;
        } catch {
            userId = null;
        }
    }

    if (!['start', 'complete'].includes(action)) {
        return res.status(400).json({ success: false, message: "Invalid session action." });
    }

    try {
        const { rows } = await db.query(`
            SELECT b.booking_id, b.status, b.session_status, b.session_token, b.started_at, b.completed_at,
                   b.seeker_id, s.provider_id, s.price_per_session
            FROM bookings b
            JOIN skills s ON s.skill_id = b.skill_id
            WHERE b.booking_id = $1
        `, [bookingId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Booking not found." });
        }

        const booking = rows[0];
        const validToken = !!token && booking.session_token === token;
        const authorized = validToken || (userId && (userId === booking.provider_id || userId === booking.seeker_id));

        if (!authorized) {
            return res.status(403).json({ success: false, message: "Not authorized for this session." });
        }

        if (action === 'start') {
            const newToken = booking.session_token || generateSessionToken();
            await db.query(
                `UPDATE bookings
                 SET status = COALESCE(NULLIF(status, 'Pending'), 'Accepted'),
                     session_status = 'Active',
                     session_token = $2,
                     started_at = COALESCE(started_at, NOW()),
                     completed_at = NULL
                 WHERE booking_id = $1`,
                [bookingId, newToken]
            );
            return res.json({
                success: true,
                message: "Session started.",
                booking: {
                    booking_id: bookingId,
                    session_status: 'Active',
                    session_token: newToken,
                    status: 'Accepted'
                }
            });
        }

        if (booking.session_status !== 'Active') {
            return res.status(400).json({ success: false, message: "Session is not active yet." });
        }

        // Calculate session duration and total price
        const startTime = new Date(booking.started_at);
        const endTime = new Date();
        const durationMinutes = Math.round((endTime - startTime) / 60000); // Convert ms to minutes
        const pricePerMinute = (booking.price_per_session || 0) / 60; // Assume price_per_session is hourly rate
        const totalPrice = Math.round(durationMinutes * pricePerMinute * 100) / 100; // Round to 2 decimals

        await db.query(
            `UPDATE bookings
             SET status = 'Completed',
                 session_status = 'Completed',
                 completed_at = NOW()
             WHERE booking_id = $1`,
            [bookingId]
        );

        return res.json({
            success: true,
            message: "Session completed.",
            booking: {
                booking_id: bookingId,
                session_status: 'Completed',
                status: 'Completed',
                started_at: booking.started_at,
                completed_at: new Date().toISOString(),
                duration_minutes: durationMinutes,
                price_per_minute: Math.round(pricePerMinute * 100) / 100,
                total_price: totalPrice
            }
        });
    } catch (err) {
        console.error("Session control error:", err);
        return res.status(500).json({ success: false, message: "Failed to manage session." });
    }
});

app.get("/api/bookings/:id/verify", async (req, res) => {
    const bookingId = req.params.id;
    const { token } = req.query;

    try {
        const { rows } = await db.query(`
            SELECT b.booking_id, b.status, b.session_status, b.session_token, b.started_at, b.completed_at,
                   s.skill_name, u.full_name AS seeker_name
            FROM bookings b
            JOIN skills s ON s.skill_id = b.skill_id
            JOIN users u ON u.user_id = b.seeker_id
            WHERE b.booking_id = $1
        `, [bookingId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Booking not found." });
        }

        const booking = rows[0];
        if (token && booking.session_token !== token) {
            return res.status(403).json({ success: false, message: "Invalid session token." });
        }

        return res.json({ success: true, booking });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to verify booking." });
    }
});

app.get("/session/verify/:bookingId", async (req, res) => {
    const bookingId = req.params.bookingId;
    const token = req.query.token;

    try {
        const { rows } = await db.query(`
            SELECT b.booking_id, b.status, b.session_status, b.session_token, b.started_at, b.completed_at,
                   s.skill_name, u.full_name AS seeker_name
            FROM bookings b
            JOIN skills s ON s.skill_id = b.skill_id
            JOIN users u ON u.user_id = b.seeker_id
            WHERE b.booking_id = $1
        `, [bookingId]);

        if (rows.length === 0) {
            return res.status(404).send("Booking not found.");
        }

        const booking = rows[0];
        if (token && booking.session_token !== token) {
            return res.status(403).send("Invalid session token.");
        }

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SkillSwap Session</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; background:#f5f7fb; color:#111827; margin:0; display:grid; place-items:center; min-height:100vh; }
    .card { background:white; padding:24px; border-radius:16px; box-shadow:0 12px 32px rgba(0,0,0,.12); width:min(92vw, 480px); }
    button { width:100%; padding:12px; border:none; border-radius:10px; cursor:pointer; font-weight:700; margin-top:10px; }
    .start { background:#2ecc71; color:white; }
    .complete { background:#3498db; color:white; }
  </style>
</head>
<body>
  <div class="card">
    <h2>SkillSwap Session</h2>
    <p><strong>Skill:</strong> ${booking.skill_name}</p>
    <p><strong>Seeker:</strong> ${booking.seeker_name}</p>
    <p><strong>Status:</strong> ${booking.session_status || 'Not Started'}</p>
    <button class="start" onclick="startSession()">Start Session</button>
    <button class="complete" onclick="completeSession()">Complete Session</button>
    <p id="message" style="margin-top:14px; color:#4b5563;"></p>
  </div>
  <script>
    const bookingId = ${bookingId};
    const token = ${JSON.stringify(token || '')};
    async function callSession(action) {
      const res = await fetch('/api/bookings/' + bookingId + '/session-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, token })
      });
      const data = await res.json();
      document.getElementById('message').textContent = data.message || 'Done';
    }
    function startSession() { callSession('start'); }
    function completeSession() { callSession('complete'); }
  </script>
</body>
</html>`;

        res.send(html);
    } catch (err) {
        res.status(500).send("Failed to load session page.");
    }
});

// ====================== START SERVER ======================
// '0.0.0.0' makes it reachable from other devices on the same WiFi/network,
// not just from this machine via localhost.
// ====================== CATCH-ALL ROUTE FOR FRONTEND PAGES ======================
app.get('*', (req, res) => {
    const filePath = path.join(__dirname, '../FRONTEND/HTML/home.html');
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).send('Page not found');
        }
    });
});

async function initializeAdminAccount() {
    try {
        const { rows } = await db.query(`SELECT admin_id FROM admin LIMIT 1`);

        if (rows.length > 0) {
            return;
        }

        const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
        const defaultPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

        await db.query(
            `INSERT INTO admin (username, password) VALUES ($1, $2)`,
            [defaultUsername, defaultPassword]
        );

        console.log(`Default admin account created: ${defaultUsername}/${defaultPassword}`);
    } catch (err) {
        console.error('Admin bootstrap error:', err);
    }
}

initializeAdminAccount().finally(() => {
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`SkillSwap Server is running:`);
        console.log(`  Local:   http://localhost:${PORT}`);
        console.log(`  Network: http://<your-ip-address>:${PORT}  (find it with 'ipconfig' or 'ifconfig')`);
    });
});