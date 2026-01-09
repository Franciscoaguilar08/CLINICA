import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    console.log("Iniciando migración integral...");
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log("- Verificando tabla 'patients'...");
        await client.query(`
      ALTER TABLE patients 
      ADD COLUMN IF NOT EXISTS insurance VARCHAR(100),
      ADD COLUMN IF NOT EXISTS primary_condition VARCHAR(100),
      ADD COLUMN IF NOT EXISTS social_vulnerability INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS social_factors JSONB DEFAULT '[]';
    `);

        console.log("- Verificando tabla 'risk_assessments'...");
        await client.query(`
      ALTER TABLE risk_assessments 
      ADD COLUMN IF NOT EXISTS summary TEXT,
      ADD COLUMN IF NOT EXISTS drivers JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS actual_outcome VARCHAR(50),
      ADD COLUMN IF NOT EXISTS feedback_notes TEXT;
    `);

        console.log("- Verificando tabla 'medications'...");
        await client.query(`
      ALTER TABLE medications 
      ADD COLUMN IF NOT EXISTS dosage VARCHAR(100),
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
    `);

        await client.query('COMMIT');
        console.log("Migración integral completada.");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Error en la migración:", e);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
