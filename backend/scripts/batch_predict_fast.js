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

async function runBatchFast() {
    console.log("🚀 Iniciando Motor de Predicción Ultra-Rápido...");
    const client = await pool.connect();
    try {
        // 1. Fetch ALL data at once to minimize roundtrips
        console.log("📥 Descargando cohorte poblacional...");
        const patientsRes = await client.query('SELECT id, primary_condition, social_vulnerability FROM patients');
        const medsRes = await client.query('SELECT patient_id, name FROM medications');
        const eventsRes = await client.query('SELECT patient_id, type FROM clinical_events');

        const medsMap = {};
        medsRes.rows.forEach(m => {
            if (!medsMap[m.patient_id]) medsMap[m.patient_id] = [];
            medsMap[m.patient_id].push(m);
        });

        const eventsMap = {};
        eventsRes.rows.forEach(e => {
            if (!eventsMap[e.patient_id]) eventsMap[e.patient_id] = [];
            eventsMap[e.patient_id].push(e);
        });

        console.log(`📊 Calculando riesgo para ${patientsRes.rows.length} pacientes...`);

        await client.query('BEGIN');

        for (const p of patientsRes.rows) {
            const meds = medsMap[p.id] || [];
            const events = eventsMap[p.id] || [];

            let clinicalRisk = 20;
            let pharmacologicalRisk = 10;
            let contextualRisk = (p.social_vulnerability || 1) * 15;

            const condition = (p.primary_condition || '').toLowerCase();
            if (condition.includes('diabetes')) clinicalRisk += 30;
            if (condition.includes('heart') || condition.includes('corazón')) clinicalRisk += 40;
            if (condition.includes('hypertension') || condition.includes('hipertensión')) clinicalRisk += 25;

            if (events.length > 5) clinicalRisk += 20;
            if (events.some(e => (e.type || '').toLowerCase().includes('urgencia'))) clinicalRisk += 15;

            if (meds.length > 5) pharmacologicalRisk += 30;
            if (meds.length > 10) pharmacologicalRisk += 20;

            const score = Math.min(95, Math.max(5, (clinicalRisk * 0.5) + (pharmacologicalRisk * 0.3) + (contextualRisk * 0.2)));

            let level = 'LOW';
            if (score > 75) level = 'CRITICAL';
            else if (score > 50) level = 'HIGH';
            else if (score > 25) level = 'MEDIUM';

            // Direct update inside transaction
            await client.query(
                'UPDATE patients SET risk_score = $1, risk_level = $2 WHERE id = $3',
                [score, level, p.id]
            );
        }

        await client.query('COMMIT');
        console.log("✨ ¡Procesamiento ultra-rápido completado!");
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("❌ Error en batch predict:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

runBatchFast();
