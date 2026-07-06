require("dotenv").config();
const mysql = require("mysql2/promise");
const { URL } = require("url");

let dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000
};

if (!dbConfig.host && process.env.DATABASE_URL) {
    try {
        const parsed = new URL(process.env.DATABASE_URL);
        dbConfig = {
            host: parsed.hostname,
            port: parsed.port || 3306,
            user: parsed.username,
            password: parsed.password,
            database: parsed.pathname ? parsed.pathname.slice(1) : undefined,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            connectTimeout: 10000
        };
    } catch (err) {
        console.error("Failed to parse DATABASE_URL:", err.message);
    }
}

const logConfig = {
    host: dbConfig.host,
    port: dbConfig.port || 3306,
    user: dbConfig.user,
    database: dbConfig.database
};
console.log("DB config:", logConfig);

const pool = mysql.createPool(dbConfig);

(async () => {
    try {
        const connection = await pool.getConnection();
        connection.release();
        console.log("Database connection OK");
    } catch (err) {
        console.error("Database connection test failed:", err.message);
        if (err.code) console.error("DB error code:", err.code);
    }
})();

module.exports = pool;