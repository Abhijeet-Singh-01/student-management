require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "127.0.0.1",
    database: process.env.DB_NAME || "studentdb",
    password: process.env.DB_PASSWORD || "1234",
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
});

pool.on("error", (err) => {
    console.error("Unexpected error on idle PostgreSQL client:", err);
});

module.exports = pool;
