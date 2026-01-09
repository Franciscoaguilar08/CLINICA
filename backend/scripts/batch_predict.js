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

async function calculateRisk(patientId, client) {
    try {
        const patientRes = await client.query('SELECT * FROM patients WHERE id = $1', [patientId]);
        const patient = patientRes.rows[0];

        const medsRes = await client.query('SELECT * FROM medications WHERE patient_id = $1', [patientId]);
        const meds = medsRes.rows;

        const eventsRes = await client.query('SELECT * FROM clinical_events WHERE patient_id = $1', [patientId]);
        const events = (eventsRes.rows || []);

        const measurementsRes = await client.query('SELECT * FROM clinical_measurements WHERE patient_id = $1', [patientId]);
        const measurements = (measurementsRes.rows || []);

        let clinicalRisk = 20;
        let pharmacologicalRisk = 10;
        let contextualRisk = (patient.social_vulnerability || 1) * 15;

        const condition = (patient.primary_condition || '').toLowerCase();
        if (condition.includes('diabetes')) clinicalRisk += 30;
        if (condition.includes('heart') || condition.includes('corazón')) clinicalRisk += 40;
        if (condition.includes('hypertension') || condition.includes('hipertensión')) clinicalRisk += 25;

        if (events.length > 5) clinicalRisk += 20;
        if (events.some(e => (e.type || '').toLowerCase().includes('urgencia'))) clinicalRisk += 15;

        if (meds.length > 5) pharmacologicalRisk += 30;
        if (meds.length > 10) pharmacologicalRisk += 20;

        const weights = measurements.filter(m => m.type === 'weight').sort((a, b) => new Date(b.date) - new Date(a.date));
        if (weights.length > 0 && parseFloat(weights[0].value) > 100) clinicalRisk += 10;

        const score = Math.min(95, Math.max(5, (clinicalRisk * 0.5) + (pharmacologicalRisk * 0.3) + (contextualRisk * 0.2)));

        let level = 'LOW';
        if (score > 75) level = 'CRITICAL';
        else if (score > 50) level = 'HIGH';
        else if (score > 25) level = 'MEDIUM';

        await client.query(
            'INSERT INTO risk_assessments (patient_id, score, category, summary, drivers) VALUES ($1, $2, $3, $4, $5)',
            [patientId, score, level, 'Análisis de procesamiento masivo', JSON.stringify([{ factor: 'Procesamiento Masivo', impact: score }])]
        );

        await client.query(
            'UPDATE patients SET risk_score = $1, risk_level = $2 WHERE id = $3',
            [score, level, patientId]
        );

        return { score, level };
    } catch (err) {
        console.error(`Error calculating risk for patient ${patientId}:`, err);
        throw err;
    }
}

async function runBatch() {
    console.log("🚀 Iniciando Motor de Predicción Masiva (ESM)...");
    const client = await pool.connect();
    try {
        const patientsRes = await client.query('SELECT id FROM patients');
        const patients = patientsRes.rows;
        console.log(`📊 Procesando ${patients.length} pacientes...`);

        let count = 0;
        for (const p of patients) {
            await calculateRisk(p.id, client);
            count++;
            if (count % 100 === 0) {
                console.log(`✅ Procesados ${count}/${patients.length}...`);
            }
        }

        console.log("✨ ¡Procesamiento masivo completado!");
    } catch (err) {
        console.error("❌ Error en batch predict:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

runBatch();
