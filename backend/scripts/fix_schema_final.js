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

async function run() {
    const client = await pool.connect();
    try {
        console.log("Applying structural fixes...");
        await client.query(`
            ALTER TABLE risk_assessments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
            ALTER TABLE patients ADD COLUMN IF NOT EXISTS admission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        `);
        console.log("Success! Standardized schema.");
    } catch (err) {
        console.error("Migration Error:", err);
    } finally {
        client.release();
        await pool.end();
    }
}
run();
