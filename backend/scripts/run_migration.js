import fs from 'fs';
import path from 'path';
import pkg from 'pg';
const { Pool } = pkg;
import { config } from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    const sqlPath = path.join(__dirname, '../database/schema_v2_hardening.sql');
    console.log(`📜 Ejecutando migración: ${sqlPath}`);

    try {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(sql);
            await client.query('COMMIT');
            console.log("✅ Migración Fase 4 (Hardening) completada exitosamente.");
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("❌ Error fatal en migración:", err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
