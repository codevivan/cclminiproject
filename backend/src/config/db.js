const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Reliably load .env from the backend folder
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'canteen_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

/**
 * Executes a parameterized query using the pool
 * @param {string} sql - SQL query string with ? placeholders
 * @param {Array} params - Array of parameter values
 */
const query = async (sql, params = []) => {
  const [results] = await pool.execute(sql, params);
  return results;
};

/**
 * Checks MySQL database connectivity and provides clear diagnostics
 */
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL database successfully.');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('👉 Make sure MySQL is running and your .env credentials match.');
    return false;
  }
};

module.exports = {
  pool,
  query,
  testConnection
};
