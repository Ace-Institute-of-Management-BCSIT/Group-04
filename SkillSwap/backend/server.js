const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const http = require("http");
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

const PORT = 5000;
const JWT_SECRET = "skillswap_jwt_secret_key_2026_change_in_production";

// ====================== SOCKET.IO REAL-TIME CHAT ======================
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_chat", (chatId) => {
        socket.join(`chat_${chatId}`);
        console.log(`User ${socket.id} joined chat ${chatId}`);
    });

    socket.on("send_message", (data) => {
        const { chatId, message, senderName } = data;
        
        io.to(`chat_${chatId}`).emit("receive_message", {
            message,
            senderName,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            socketId: socket.id
        });
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
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

// Update Profile Details (Including Phone Number)
app.put("/api/users/me", verifyToken, async (req, res) => {
    const userId = req.userId;
    // FIXED: Added phone to the destructured body mapping parameters
    const { full_name, bio, location, avatar, phone } = req.body;

    // FIXED: Appended phone to the SQL set operation queries
    const sql = `
        UPDATE users 
        SET full_name = ?, bio = ?, location = ?, avatar = ?, phone = ?
        WHERE user_id = ?
    `;

    try {
        // FIXED: Injected phone variable matching table syntax schema rules
        await db.query(sql, [full_name, bio, location, avatar, phone, userId]);
        return res.json({ success: true, message: "Profile updated successfully" });
    } catch (err) {
        console.error("Update Profile Error:", err);
        return res.status(500).json({ success: false, message: "Update failed" });
    }
});

// SKILL MANAGEMENT 
// Add Skill by Provider
app.post("/api/users/skills", verifyToken, (req, res) => {
    const userId = req.userId;
    const { skill_name, skill_level, category, description, price_per_session, availability } = req.body;

    const sql = `
        INSERT INTO skills 
        (provider_id, skill_name, category, description, skill_level, 
         price_per_session, location, availability)
        VALUES (?, ?, ?, ?, ?, ?, 'Kathmandu', ?)
    `;

    db.query(sql, [
        userId, 
        skill_name, 
        category || 'General', 
        description, 
        skill_level || 'Intermediate',
        price_per_session || 0,
        availability || 'Flexible'
    ], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Failed to add skill" });
        }
        res.json({ success: true, message: "Skill added successfully!" });
    });
});

// Get All Active Skills for "Find Skills" Page
app.get("/api/skills", (req, res) => {
    const sql = `
        SELECT s.skill_id, s.skill_name, s.category, s.description, 
               s.skill_level, s.price_per_session, s.location, s.availability,
               u.full_name as provider_name, u.avatar, u.user_id as provider_id
        FROM skills s
        JOIN users u ON s.provider_id = u.user_id
        WHERE s.status = 'active'
        ORDER BY s.created_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "Database error" });
        
        res.json({
            success: true,
            skills: results
        });
    });
});

app.listen(PORT, () => {
    console.log(`✅ SkillSwap Server executing cleanly on http://localhost:${PORT}`);
});