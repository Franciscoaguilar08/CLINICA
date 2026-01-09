import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    console.log("Iniciando migración: Feedback Loop...");
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log("- Añadiendo columnas de feedback a risk_assessments...");
        await client.query(`
      ALTER TABLE risk_assessments 
      ADD COLUMN IF NOT EXISTS actual_outcome VARCHAR(50),
      ADD COLUMN IF NOT EXISTS feedback_notes TEXT;
    `);

        await client.query('COMMIT');
        console.log("Migración completada exitosamente.");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Error en la migración:", e);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
