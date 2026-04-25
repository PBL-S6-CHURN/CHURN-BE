const { Pool } = require("pg");
const dbConfig = require("./db.config");

const pool = new Pool(dbConfig);

// Test connection
pool.on("connect", () => {
    console.log("Connected to PostgreSQL database");
});

pool.on("error", (err) => {
    console.error("Database connection error:", err);
});

// test database connection
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log("Database connection test successful");
        client.release();
        return true;
    } catch (err) {
        console.error("Database connection test failed:", err);
        return false;
    }
};

// execute queries
const query = async (sql, params) => {
    try {
        const start = Date.now();
        const res = await pool.query(sql, params);
        const duration = Date.now() - start;
        // console.log("Executed query", { sql, duration, rows: res.rowCount });
        return res;
    } catch (err) {
        console.error("Query error:", err);
        throw err;
    }
};

const getClient = async () => {
    return await pool.connect();
};

module.exports = {
    pool,
    query,
    getClient,
    testConnection,
};