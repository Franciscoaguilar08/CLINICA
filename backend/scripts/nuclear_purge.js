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

async function nuclearPurge() {
    const client = await pool.connect();
    try {
        console.log("☢️ INICIANDO PURGA NUCLEAR...");

        // 1. Truncate child tables (Wipe all clinical history)
        // Using CASCADE to be sure
        const tables = ['risk_assessments', 'medications', 'clinical_events', 'clinical_measurements', 'diagnostics'];
        for (const t of tables) {
            console.log(`   - Truncating ${t}...`);
            await client.query(`TRUNCATE TABLE ${t} CASCADE`);
        }

        // 2. Delete safely from patients (now that children are empty)
        console.log("   - Deleting Kaggle Patients...");
        const res = await client.query("DELETE FROM patients WHERE name LIKE 'Kaggleuser%'");

        console.log(`✅ NUCLEAR PURGE COMPLETE. Removed ${res.rowCount} Kaggle patients. History wiped.`);

    } catch (err) {
        console.error("❌ Error en Nuclear Purge:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

nuclearPurge();
