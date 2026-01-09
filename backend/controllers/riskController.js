import { query } from '../database/db.js';

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
