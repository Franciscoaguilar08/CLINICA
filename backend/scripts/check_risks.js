import pkg from 'pg';
const { Pool } = pkg;
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        const res = await pool.query('SELECT id, first_name, last_name, risk_score, risk_level FROM patients WHERE risk_score > 0 LIMIT 10');
        console.log("Patients with score > 0:", res.rows);

        const zeroRes = await pool.query('SELECT count(*) FROM patients WHERE risk_score IS NULL OR risk_score = 0');
        console.log("Patients with 0 or NULL score:", zeroRes.rows[0].count);
    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        await pool.end();
    }
}
check();
