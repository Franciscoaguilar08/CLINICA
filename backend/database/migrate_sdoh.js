import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log("Iniciando migración Capa 9: Determinantes Sociales...");

        await client.query('BEGIN');

        // Agregar columna social_vulnerability (1-5)
        await client.query(`
      ALTER TABLE patients 
      ADD COLUMN IF NOT EXISTS social_vulnerability INTEGER DEFAULT 1;
    `);

        // Agregar columna social_factors (JSONB)
        await client.query(`
      ALTER TABLE patients 
      ADD COLUMN IF NOT EXISTS social_factors JSONB DEFAULT '[]';
    `);

        await client.query('COMMIT');
        console.log("Migración completada exitosamente.");
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error en la migración:", err);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
