require('dotenv').config();
const {Pool} = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || "db",
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "Admin",
    database: process.env.DB_NAME || "bema_crm_table_schema",
})

pool.on('error', (err) => {
    console.log("unexpected error on postgres client", err);
    process.exit(1);
})

async function testConnection() {
    const res = await pool.query('SELECT NOW() FROM now()')
    console.log('DB connection OK. Time:', res.rows[0].now)

}

module.exports = {
    query: (text, params) => pool.query(text, params),
    testConnection,
};