require('dotenv').config();

const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Signup
app.post("/signup", (req, res) => {

    const {
        full_name,
        email,
        phone,
        password,
        role
    } = req.body;

    const sql = `
    INSERT INTO users
    (full_name,email,phone,password,role)
    VALUES (?,?,?,?,?)
    `;

    db.query(
        sql,
        [full_name, email, phone, password, role],
        (err, result) => {

            if (err) {
                return res.status(400).json({
                    message: "Email already exists"
                });
            }

            res.json({
                message: "Signup Successful"
            });
        }
    );
});

// Login
app.post("/login", (req, res) => {

    const { email, password } = req.body;

    const sql =
    "SELECT * FROM users WHERE email = ? AND password = ?";

    db.query(sql, [email, password], (err, result) => {

        if (err) {
            return res.json({
                success: false,
                message: "Database Error"
            });
        }

        if (result.length > 0) {
            return res.json({
                success: true,
                message: "Login Successful"
            });
        }

        return res.json({
            success: false,
            message: "Invalid Email or Password"
        });
    });
});

// Health Check
app.get("/", (req, res) => {
    res.json({
        message: "SkillSwap Backend Running"
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});