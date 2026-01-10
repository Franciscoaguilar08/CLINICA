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

async function migrate() {
    const client = await pool.connect();
    try {
        console.log("🚀 Iniciando migración de columnas de riesgo...");
        await client.query(`
            ALTER TABLE patients 
            ADD COLUMN IF NOT EXISTS risk_score DECIMAL(5,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20) DEFAULT 'LOW';
        `);
        console.log("✅ Columnas risk_score y risk_level agregadas.");
    } catch (err) {
        console.error("❌ Error en migración:", err);
    } finally {
        client.release();
        await pool.end();
    }
}
migrate();
