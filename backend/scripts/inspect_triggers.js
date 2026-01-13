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

async function inspectTriggers() {
    const client = await pool.connect();
    try {
        console.log("🔍 INSPECTING TRIGGERS...");

        const res = await client.query(`
            SELECT event_object_table as table_name, trigger_name, action_statement 
            FROM information_schema.triggers 
            WHERE event_object_table IN ('patients', 'risk_assessments', 'medications', 'clinical_events')
        `);

        if (res.rows.length === 0) {
            console.log("No triggers found.");
        } else {
            console.log(JSON.stringify(res.rows, null, 2));
        }

    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

inspectTriggers();
