import { Sequelize } from 'sequelize';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DB_NAME = process.env.DATABASE_NAME;
const DB_USER = process.env.DATABASE_USER;
const DB_PASS = process.env.DATABASE_PASSWORD;
const DB_HOST = process.env.DATABASE_HOST;
const DB_PORT = Number(process.env.DATABASE_PORT) || 3306; // normalize to number

// Validate required DB env configuration early (guard clauses)
function validateDbConfig() {
  const missing = [];
  if (!DB_NAME) missing.push('DATABASE_NAME');
  if (!DB_USER) missing.push('DATABASE_USER');
  if (!DB_PASS) missing.push('DATABASE_PASSWORD');
  if (!DB_HOST) missing.push('DATABASE_HOST');
  if (Number.isNaN(DB_PORT)) missing.push('DATABASE_PORT');

  if (missing.length > 0) {
    throw new Error(
      `Missing required database environment variables: ${missing.join(', ')}. ` +
        'Please set them in your .env before starting the server.'
    );
  }
}

// Ensure the database exists
async function ensureDatabase() {
  const connection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    port: DB_PORT,
  });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
  await connection.end();
}

// Ensure DB before connecting
validateDbConfig();
try {
  await ensureDatabase();
} catch (err) {
  // Fail fast with a clear message and original error context
  console.error('[DB] Failed to ensure database exists:', err?.message || err);
  throw err;
}

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  dialect: 'mysql',
  port: DB_PORT,
  logging: false,
});

export default sequelize;
