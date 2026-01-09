import { query } from '../database/db.js';

export const getMeasurementsByPatient = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { type } = req.query; // Opcional: filtrar por tipo

        let text = 'SELECT * FROM clinical_measurements WHERE patient_id = $1';
        let values = [patientId];

        if (type) {
            text += ' AND type = $2';
            values.push(type);
        }

        text += ' ORDER BY date ASC';

        const result = await query(text, values);
        res.json(result.rows);
    } catch (error) {
        console.error("Error al obtener mediciones:", error);
        res.status(500).json({ error: "Error al obtener datos clínicos" });
    }
};

export const createMeasurement = async (req, res) => {
    try {
        const { patient_id, type, value, unit, date } = req.body;

        if (!patient_id || !type || value === undefined) {
            return res.status(400).json({ error: "Faltan datos requeridos (Paciente, Tipo o Valor)" });
        }

        const text = `
            INSERT INTO clinical_measurements (patient_id, type, value, unit, date)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const values = [patient_id, type, value, unit, date || new Date()];

        const result = await query(text, values);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error al registrar medición:", error);
        res.status(500).json({ error: "Error al registrar el dato clínico" });
    }
};
