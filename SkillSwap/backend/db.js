require("dotenv").config();
const { Pool } = require("pg");
const { URL } = require("url");

let poolConfig = {};

if (process.env.DATABASE_URL) {
    poolConfig.connectionString = process.env.DATABASE_URL;
    poolConfig.ssl = { rejectUnauthorized: false };
} else {
    poolConfig = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: { rejectUnauthorized: false }
    };
}

const logConfig = {
    host: poolConfig.host || new URL(process.env.DATABASE_URL).hostname,
    port: poolConfig.port || 5432,
    user: poolConfig.user || new URL(process.env.DATABASE_URL).username,
    database: poolConfig.database || new URL(process.env.DATABASE_URL).pathname.slice(1)
};
console.log("DB config:", logConfig);

const pool = new Pool(poolConfig);

(async () => {
    try {
        const client = await pool.connect();
        client.release();
        console.log("Database connection OK");
    } catch (err) {
        console.error("Database connection test failed:", err.message);
        if (err.code) console.error("DB error code:", err.code);
    }
})();

module.exports = pool;