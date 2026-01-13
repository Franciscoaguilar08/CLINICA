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
        const tables = ['patients', 'medications', 'clinical_events', 'clinical_measurements', 'risk_assessments', 'diagnostics', 'audit_logs'];

        for (const t of tables) {
            console.log(`\n--- Table: ${t} ---`);
            const res = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = $1
            `, [t]);

            if (res.rows.length === 0) {
                console.log("⚠️ TABLE NOT FOUND");
            } else {
                console.log(res.rows.map(r => r.column_name).join(', '));
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        await pool.end();
    }
}

check();
