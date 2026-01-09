import { query } from '../database/db.js';

// Listar eventos de un paciente específico
export const getEventsByPatient = async (req, res) => {
    try {
        const { patientId } = req.params;
        const result = await query(
            'SELECT * FROM clinical_events WHERE patient_id = $1 ORDER BY date DESC',
            [patientId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Error al obtener eventos:", error);
        res.status(500).json({ error: "Error al obtener eventos clínicos" });
    }
};

// Registrar un nuevo evento clínico
export const createEvent = async (req, res) => {
    try {
        const { patient_id, type, date, notes } = req.body;

        if (!patient_id || !type) {
            return res.status(400).json({ error: "Faltan datos requeridos (Paciente e Hito)" });
        }

        const text = `
            INSERT INTO clinical_events (patient_id, type, date, notes)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const values = [patient_id, type, date || new Date(), notes];

        const result = await query(text, values);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error al registrar evento:", error);
        res.status(500).json({ error: "Error al registrar el hito clínico" });
    }
};
