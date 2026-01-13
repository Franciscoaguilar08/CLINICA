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

async function debugPurge() {
    const client = await pool.connect();
    try {
        console.log("🐞 DEBUGGING PURGE...");

        // Get ONE ID
        const res = await client.query("SELECT id FROM patients WHERE name LIKE 'Kaggleuser%' LIMIT 1");
        if (res.rows.length === 0) {
            console.log("No Kaggle patients found.");
            return;
        }
        const pid = res.rows[0].id;
        console.log(`Testing delete for Patient ID: ${pid}`);

        // Try deleting from children one by one
        const tables = ['risk_assessments', 'medications', 'clinical_events', 'clinical_measurements', 'diagnostics'];

        for (const t of tables) {
            try {
                process.stdout.write(`Attempting DELETE FROM ${t}... `);
                await client.query(`DELETE FROM ${t} WHERE patient_id = $1`, [pid]);
                console.log("✅ OK");
            } catch (e) {
                console.log("❌ FAIL");
                console.error(`Error deleting from ${t}:`, e.message, e.detail ? e.detail : '', e.code);
            }
        }

        // Try deleting parent
        try {
            process.stdout.write(`Attempting DELETE FROM patients... `);
            await client.query("DELETE FROM patients WHERE id = $1", [pid]);
            console.log("✅ OK");
        } catch (e) {
            console.log("❌ FAIL");
            console.error("Error deleting from patients:", e);
        }

    } catch (err) {
        console.error("Global Error:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

debugPurge();
