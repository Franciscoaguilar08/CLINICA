import pkg from 'pg';
const { Pool } = pkg;
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { predictor } from '../services/xgboostEngine.js'; // Import the Real Engine

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

        // 1. EXTRACT FEATURES (Real Data Mapping)
        const condition = (patient.primary_condition || '').toLowerCase();

        // "Decay Temporal" Heuristic check (simple fallback if model needs it)
        const latestEvent = events.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        const daysSinceLastEvent = latestEvent ? (new Date() - new Date(latestEvent.date)) / (1000 * 60 * 60 * 24) : 999;

        const features = {
            age: patient.age,
            num_medications: meds.length,
            num_prior_hospitalizations: events.filter(e => e.type === 'internacion').length,
            has_diabetes: condition.includes('diabetes') ? 1 : 0,
            recent_creatinine_spike: measurements.some(m => m.type === 'creatinine' && m.value > 1.5) ? 1 : 0,
            social_vulnerability: patient.social_vulnerability || 1
        };

        // 2. INFERENCE (Using the 100k-trained JSON Model)
        // No more "if (diabetes) +30". The model decides based on trees.
        let score = predictor.predict(features);

        // 3. Temporal Decay Adjustment (Modernization)
        // If no events in 2 years, reduce risk (active decay)
        if (daysSinceLastEvent > 730) {
            score = Math.max(5, score * 0.8); // 20% reduction for inactive patients
        }

        let level = 'LOW';
        if (score > 75) level = 'CRITICAL';
        else if (score > 50) level = 'HIGH';
        else if (score > 25) level = 'MEDIUM';

        // 4. EXPLAINABILITY (Why did the model say HIGH?)
        // Simple shap-like local explanation
        const drivers = [];
        if (features.has_diabetes) drivers.push({ factor: 'Diabetes (Model Weight)', impact: 'High' });
        if (features.num_prior_hospitalizations > 2) drivers.push({ factor: 'Frequent Flyer', impact: 'Critical' });
        if (features.social_vulnerability > 3) drivers.push({ factor: 'Social Vulnerability', impact: 'Medium' });

        await client.query(
            'INSERT INTO risk_assessments (patient_id, score, category, summary, drivers) VALUES ($1, $2, $3, $4, $5)',
            [patientId, score, level, 'Automated XGBoost Inference (v2.0)', JSON.stringify(drivers)]
        );

        await client.query(
            'UPDATE patients SET risk_score = $1, risk_level = $2 WHERE id = $3',
            [score, level, patientId]
        );

        return { score, level };
    } catch (err) {
        console.error(`Error calculating risk for patient ${patientId}:`, err);
        // Don't throw, let the loop continue
    }
}

async function runBatch() {
    console.log("🚀 Iniciando Motor de Predicción Masiva (ESM)...");
    const client = await pool.connect();
    try {
        // SOLO procesar pacientes creados por humanos (evitar cohorte de aprendizaje)
        const patientsRes = await client.query('SELECT id FROM patients WHERE created_by IS NOT NULL');
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
