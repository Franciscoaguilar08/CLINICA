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

async function purge() {
    const client = await pool.connect();
    try {
        console.log("🔥 INICIANDO PURGA DE DATASET 'KaggleUser'...");

        // Count before
        const countRes = await client.query("SELECT count(*) FROM patients WHERE name LIKE 'Kaggleuser%'");
        const count = countRes.rows[0].count;
        console.log(`📉 Detectados ${count} registros para eliminar.`);

        if (count > 0) {
            // RELY ON CASCADE: Schema has ON DELETE CASCADE defined for all related tables.
            const deleteRes = await client.query("DELETE FROM patients WHERE name LIKE 'Kaggleuser%'");
            console.log(`✅ ${deleteRes.rowCount} Pacientes eliminados exitosamente (CASCADE handled children).`);
        } else {
            console.log("NOTE: No hay pacientes de Kaggle para eliminar.");
        }

    } catch (err) {
        console.error("❌ Error en Purga:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

purge();
