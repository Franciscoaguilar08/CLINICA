import { query } from '../database/db.js';

// Listar todos los pacientes (Puede filtrarse por médico si se desea más adelante)
export const getPatients = async (req, res) => {
    try {
        // req.user viene del middleware de auth (ya sabemos quién es)
        const result = await query('SELECT * FROM patients WHERE risk_score > 0 ORDER BY admission_date DESC');
        res.json(result.rows);
    } catch (error) {
        console.error("Error al obtener pacientes:", error);
        res.status(500).json({ error: "Error al obtener pacientes" });
    }
};

// Crear un nuevo paciente
export const createPatient = async (req, res) => {
    try {
        const { first_name, last_name, age, gender, insurance, primary_condition, system_type, social_vulnerability, social_factors } = req.body;
        const userId = req.user.id; // El médico que lo crea

        // Validación básica
        if (!first_name || !last_name || !age) {
            return res.status(400).json({ error: "Faltan datos requeridos (Nombre, Apellido, Edad)" });
        }

        const text = `
      INSERT INTO patients (first_name, last_name, age, gender, insurance, primary_condition, system_type, created_by, social_vulnerability, social_factors)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
        const values = [
            first_name,
            last_name,
            age,
            gender,
            insurance,
            primary_condition,
            system_type || 'General',
            userId,
            social_vulnerability || 1,
            JSON.stringify(social_factors || [])
        ];

        const result = await query(text, values);
        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error("Error al crear paciente:", error);
        res.status(500).json({ error: "Error al crear el paciente" });
    }
};

// Obtener un paciente por ID
export const getPatientById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('SELECT * FROM patients WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Paciente no encontrado" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error al obtener paciente:", error);
        res.status(500).json({ error: "Error interno" });
    }
};
