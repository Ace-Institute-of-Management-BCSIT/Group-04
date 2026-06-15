const express = require("express");
const cors = require("cors");

const db = require("./db");

const app = express();

const dotenv = require('dotenv');

dotenv.config();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.post("/signup", (req, res) => {

    const {
        full_name,
        email,
        phone,
        password,
        role
    } = req.body;

      console.log("Password received:", password);

    const sql = `
    INSERT INTO users
    (full_name,email,phone,password,role)
    VALUES (?,?,?,?,?)
    `;

    db.query(
        sql,
        [
            full_name,
            email,
            phone,
            password,
            role
        ],

        
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

        } else {

            return res.json({
                success: false,
                message: "Invalid Email or Password"
            });
        }
    });
});

app.listen(PORT,()=>{

    console.log(
        `Server running on port ${PORT}`
    );

});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'SkillSwap Backend is running 🚀' });
});