const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/blood_drive_db';

const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' && !connectionString.includes('localhost') 
        ? { rejectUnauthorized: false } 
        : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

let isConnected = false;

// Test connection and auto-run schema migrations if connected
async function initializeDatabase() {
    try {
        const client = await pool.connect();
        isConnected = true;
        console.log('✅ Connected to PostgreSQL database successfully.');

        // Read and execute schema
        const schemaPath = path.join(__dirname, '../db/schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
            await client.query(schemaSql);
            console.log('✅ Database schema verified and updated.');
        }

        client.release();
    } catch (err) {
        console.warn('⚠️ Warning: PostgreSQL database is not currently reachable at:', connectionString);
        console.warn('   Details:', err.message);
        console.warn('   (You can set your valid PostgreSQL credentials in server/.env)');
        isConnected = false;
    }
}

// Transaction wrapper helper for ACID operations with row-level locks
async function executeTransaction(callback) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    pool,
    query: (text, params) => pool.query(text, params),
    executeTransaction,
    initializeDatabase,
    isDbConnected: () => isConnected,
};
