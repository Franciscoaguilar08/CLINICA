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

async function runTargetedBatch() {
    console.log("🚀 Iniciando Motor de Predicción Selectiva (50 Pacientes)...");
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Resetear todos a 0 para asegurar el experimento limpio
        console.log("🧹 Reseteando scores poblacionales...");
        await client.query('UPDATE patients SET risk_score = 0, risk_level = \'LOW\'');

        // 2. Seleccionar solo 50 pacientes
        const targetedRes = await client.query('SELECT id, primary_condition, social_vulnerability FROM patients LIMIT 50');
        const medCountRes = await client.query('SELECT patient_id, count(*) as count FROM medications GROUP BY patient_id');
        const medCounts = {};
        medCountRes.rows.forEach(r => medCounts[r.patient_id] = parseInt(r.count));

        console.log(`📊 Calculando riesgo activo para ${targetedRes.rows.length} pacientes...`);

        for (const p of targetedRes.rows) {
            let clinicalRisk = 20;
            let pharmacologicalRisk = 10;
            let contextualRisk = (p.social_vulnerability || 1) * 15;

            const condition = (p.primary_condition || '').toLowerCase();
            if (condition.includes('diabetes')) clinicalRisk += 30;
            if (condition.includes('heart') || condition.includes('corazón')) clinicalRisk += 40;
            if (condition.includes('hypertension')) clinicalRisk += 25;

            const meds = medCounts[p.id] || 0;
            if (meds > 5) pharmacologicalRisk += 30;

            const score = Math.min(95, Math.max(5, (clinicalRisk * 0.5) + (pharmacologicalRisk * 0.3) + (contextualRisk * 0.2)));

            let level = 'LOW';
            if (score > 75) level = 'CRITICAL';
            else if (score > 50) level = 'HIGH';
            else if (score > 25) level = 'MEDIUM';

            await client.query(
                'UPDATE patients SET risk_score = $1, risk_level = $2 WHERE id = $3',
                [score, level, p.id]
            );
        }

        await client.query('COMMIT');
        console.log("✨ ¡Predicción selectiva completada! Los otros 1,950+ quedan para aprendizaje.");
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("❌ Error en batch selectivo:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

runTargetedBatch();
