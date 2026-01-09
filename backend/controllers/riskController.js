import { query } from '../database/db.js';
import { predictor } from '../services/xgboostEngine.js';

export const getRiskHistory = async (req, res) => {
    try {
        const { patientId } = req.params;
        const result = await query(
            'SELECT * FROM risk_assessments WHERE patient_id = $1 ORDER BY created_at ASC',
            [patientId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Error al obtener historial de riesgo:", error);
        res.status(500).json({ error: "Error al cargar historial predictivo" });
    }
};

export const saveRiskAssessment = async (req, res) => {
    try {
        const { patient_id, score, category, source, summary, drivers } = req.body;

        if (!patient_id || score === undefined) {
            return res.status(400).json({ error: "Faltan datos (Paciente o Score)" });
        }

        const text = `
            INSERT INTO risk_assessments (patient_id, score, category, source, summary, drivers)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const values = [
            patient_id,
            score,
            category || 'MEDIUM',
            source || 'REALTIME_AI',
            summary,
            JSON.stringify(drivers || [])
        ];

        const result = await query(text, values);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error al guardar evaluación de riesgo:", error);
        res.status(500).json({ error: "Error al persistir el análisis" });
    }
};

export const updateRiskFeedback = async (req, res) => {
    try {
        const { assessmentId } = req.params;
        const { actual_outcome, feedback_notes } = req.body;

        const text = `
            UPDATE risk_assessments 
            SET actual_outcome = $1, feedback_notes = $2
            WHERE id = $3
            RETURNING *
        `;
        const values = [actual_outcome, feedback_notes, assessmentId];

        const result = await query(text, values);
        if (result.rows.length === 0) return res.status(404).json({ error: "Evaluación no encontrada" });

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error al actualizar feedback:", error);
        res.status(500).json({ error: "No se pudo actualizar el feedback" });
    }
};


/**
 * CAPA 13: Motor de Riesgo de 3 Ejes (Arquitectura Avanzada)
 * 1. Riesgo Clínico Biológico (Dependiente de Patología)
 * 2. Riesgo Farmacológico (Polifarmacia y Seguridad)
 * 3. Riesgo Contextual (SDOH y Antecedentes)
 */
export const runAdvancedRiskAnalysis = async (req, res) => {
    try {
        const { patientId } = req.params;

        // 1. Obtener Datos Maestros del Paciente
        const pResult = await query('SELECT * FROM patients WHERE id = $1', [patientId]);
        if (pResult.rows.length === 0) return res.status(404).json({ error: "Paciente no encontrado" });
        const patient = pResult.rows[0];

        // 2. Obtener Contexto Clínico (Eventos, Mediciones, Medicación)
        const events = (await query('SELECT * FROM clinical_events WHERE patient_id = $1', [patientId])).rows;
        const measurements = (await query('SELECT * FROM clinical_measurements WHERE patient_id = $1 ORDER BY date DESC', [patientId])).rows;
        const medications = (await query('SELECT * FROM medications WHERE patient_id = $1 AND is_active = TRUE', [patientId])).rows;

        // --- EJE 1: RIESGO CLÍNICO BIOLÓGICO (Dinámico) ---
        let clinicalRisk = 0;
        const pathology = (patient.primary_condition || 'General').toLowerCase();

        if (pathology.includes('insuficiencia cardíaca') || pathology.includes('ic') || pathology.includes('heart failure')) {
            // ESC Guidelines: Peso, Creatinina, iSGLT2
            const weights = measurements.filter(m => m.type === 'peso');
            if (weights.length >= 2 && weights[0].value && weights[1].value) {
                if (parseFloat(weights[0].value) - parseFloat(weights[1].value) > 2) clinicalRisk += 40;
            }
            const egfr = measurements.find(m => m.type === 'creatinina');
            if (egfr && egfr.value && parseFloat(egfr.value) > 1.5) clinicalRisk += 30;
            if (medications.length > 0 && !medications.some(m => m.name.toLowerCase().match(/empaglifloz|dapaglifloz/))) clinicalRisk += 20;
        } else if (pathology.includes('asma') || pathology.includes('asthma')) {
            // GINA Guidelines: SABA, Crisis
            const rescueMeds = medications.filter(m => m.name.toLowerCase().includes('salbutamol'));
            if (rescueMeds.length > 0) clinicalRisk += 30;
            const crises = (events || []).filter(e => e.type === 'guardia' || e.type === 'internacion').length;
            clinicalRisk += Math.min(crises * 20, 50);
        } else if (pathology.includes('diabetes')) {
            // ADA: HbA1c, Hipos
            const hba1c = measurements.find(m => m.type === 'hba1c');
            if (hba1c && hba1c.value && parseFloat(hba1c.value) > 9) clinicalRisk += 50;
            const hypos = (events || []).filter(e => e.notes?.toLowerCase().includes('hipoglucemia')).length;
            clinicalRisk += Math.min(hypos * 25, 40);
        } else if (pathology.includes('hypertension') || pathology.includes('hipertensión')) {
            const bp = measurements.find(m => m.type === 'tension_arterial');
            if (bp && bp.value && parseFloat(bp.value) > 160) clinicalRisk += 40;
            else clinicalRisk = 25;
        } else {
            clinicalRisk = 20; // Base para patologías no mapeadas pero presentes
        }
        clinicalRisk = Math.min(clinicalRisk, 100);

        // --- EJE 2: RIESGO FARMACOLÓGICO ---
        let pharmRisk = 0;
        const polypharmacyCount = medications.length;
        if (polypharmacyCount > 5) pharmRisk += 40;
        if (polypharmacyCount > 8) pharmRisk += 30;
        // Simulación de cambios recientes
        const recentMedChanges = medications.filter(m => (new Date() - new Date(m.last_updated)) / (1000 * 60 * 60 * 24) < 30).length;
        pharmRisk += recentMedChanges * 10;
        pharmRisk = Math.min(pharmRisk, 100);

        // --- EJE 3: RIESGO CONTEXTUAL ---
        let contextualRisk = 0;
        if (patient.age > 75) contextualRisk += 30;
        if (patient.social_vulnerability >= 4) contextualRisk += 40;
        const priorHosps = events.filter(e => e.type === 'internacion').length;
        contextualRisk += Math.min(priorHosps * 20, 30);
        contextualRisk = Math.min(contextualRisk, 100);

        // --- SCORE FINAL: COMBINACIÓN PONDERADA ---
        // w1=0.5 (Clínico), w2=0.3 (Farma), w3=0.2 (Contexto)
        const totalScore = (clinicalRisk * 0.5) + (pharmRisk * 0.3) + (contextualRisk * 0.2);

        res.json({
            patient_id: patientId,
            score: Math.round(totalScore),
            axes: {
                clinical: clinicalRisk,
                pharmacological: pharmRisk,
                contextual: contextualRisk
            },
            pathology_used: pathology,
            guidelines: pathology.includes('ic') ? 'ESC 2023' : pathology.includes('asma') ? 'GINA 2024' : 'ADA 2024',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("[RiskEngine] Error en análisis avanzado:", error);
        res.status(500).json({ error: "Error en el motor de riesgo" });
    }
};
