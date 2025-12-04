// api/db.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || "db",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "Admin",
  database: process.env.DB_NAME || "bema_crm_table_schema",
});

pool.on('error', (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
  process.exit(1);
});

// Simple DB health check
async function testConnection() {
  const res = await pool.query('SELECT NOW()');
  console.log('DB connection OK. Time:', res.rows[0].now);
}


module.exports = pool;
module.exports.testConnection = testConnection;


