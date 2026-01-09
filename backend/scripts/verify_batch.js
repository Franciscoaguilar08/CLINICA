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
        const countRes = await pool.query('SELECT count(*) FROM risk_assessments');
        const patientRiskCount = await pool.query('SELECT count(*) FROM patients WHERE risk_score > 0');
        console.log("Total Risk Assessments:", countRes.rows[0].count);
        console.log("Patients with Risk Score > 0:", patientRiskCount.rows[0].count);
    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        await pool.end();
    }
}
check();
