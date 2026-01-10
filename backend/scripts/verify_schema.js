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

async function verify() {
    const client = await pool.connect();
    try {
        console.log("🔍 Checking Tables...");
        const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        const tableNames = tables.rows.map(r => r.table_name);
        console.log('Tables Found:', tableNames);

        console.log("\n🔍 Checking 'medications' Columns...");
        const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'medications'");
        const colNames = cols.rows.map(r => r.column_name);
        console.log('Medication Columns:', colNames);

        const hasAudit = tableNames.includes('audit_logs');
        const hasAllergies = tableNames.includes('allergies');
        const hasDosage = colNames.includes('dosage');

        if (hasAudit && hasAllergies && hasDosage) {
            console.log("\n✅ VERIFICATION SUCCESS: All Phase 4 Hardening tables present.");
        } else {
            console.error("\n❌ VERIFICATION FAILED: Missing tables or columns.");
        }

    } finally {
        client.release();
        await pool.end();
    }
}

verify();
