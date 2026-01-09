import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const runMigration = async () => {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Necesario para Render externo
    });

    try {
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('🔌 Conectando a la base de datos Render...');
        const client = await pool.connect();

        console.log('📝 Ejecutando esquema SQL...');
        await client.query(schemaSql);

        console.log('✅ ¡Base de datos inicializada correctamente! Tablas creadas.');
        client.release();
    } catch (err) {
        console.error('❌ Error migrando la base de datos:', err);
    } finally {
        await pool.end();
    }
};

runMigration();
