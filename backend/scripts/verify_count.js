import pkg from 'pg';
const { Pool } = pkg;
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    const client = await pool.connect();
    try {
        console.log("🔍 Counting Risk Assessments...");
        const res = await client.query('SELECT COUNT(*) FROM risk_assessments');
        console.log(`✅ Total Assessments: ${res.rows[0].count}`);
    } catch (err) {
        console.error("❌ DB Error:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

check();
