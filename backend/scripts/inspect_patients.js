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

async function inspect() {
    const client = await pool.connect();
    try {
        console.log("🔍 Inspecting Patients 126016, 126015, 126014...");
        const res = await client.query('SELECT id, age, primary_condition, social_vulnerability FROM patients WHERE id IN (126016, 126015, 126014)');
        console.log('Patients:', JSON.stringify(res.rows, null, 2));

        const meds = await client.query('SELECT patient_id, COUNT(*) as count FROM medications WHERE patient_id IN (126016, 126015, 126014) GROUP BY patient_id');
        console.log('Meds Count:', JSON.stringify(meds.rows, null, 2));

        const events = await client.query('SELECT patient_id, COUNT(*) as count FROM clinical_events WHERE patient_id IN (126016, 126015, 126014) GROUP BY patient_id');
        console.log('Events Count:', JSON.stringify(events.rows, null, 2));

    } catch (err) {
        console.error("❌ DB Error:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

inspect();
