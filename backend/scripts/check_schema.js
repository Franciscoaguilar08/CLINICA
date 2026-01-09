const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        const res = await pool.query('SELECT * FROM patients LIMIT 1');
        console.log("Patient record:", res.rows[0]);
        console.log("Columns:", Object.keys(res.rows[0]));
    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        await pool.end();
    }
}
check();
