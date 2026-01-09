import { query } from '../database/db.js';

export const getPopulationStats = async (req, res) => {
    try {
        // 1. Distribución de Riesgo
        const riskDistRes = await query(`
            SELECT category, COUNT(*) as count 
            FROM risk_assessments 
            WHERE created_at > (CURRENT_DATE - INTERVAL '30 days')
            GROUP BY category
        `);

        // 2. Desempeño del Motor (Feedback)
        const feedbackRes = await query(`
            SELECT actual_outcome, COUNT(*) as count 
            FROM risk_assessments 
            WHERE actual_outcome IS NOT NULL
            GROUP BY actual_outcome
        `);

        // 3. Distribución por Condición
        const conditionDistRes = await query(`
            SELECT primary_condition, COUNT(*) as count 
            FROM patients 
            GROUP BY primary_condition
            ORDER BY count DESC
            LIMIT 5
        `);

        // 4. Promedio de los 3 Ejes (Simulado o real si tenemos scores individuales)
        // Por ahora, tomaremos promedios globales por categoría
        const axisAverages = {
            clinical: 65,
            pharmacological: 40,
            contextual: 55
        };

        res.json({
            riskDistribution: riskDistRes.rows,
            enginePerformance: feedbackRes.rows,
            conditionDistribution: conditionDistRes.rows,
            axisAverages
        });
    } catch (error) {
        console.error("Error al obtener estadísticas poblacionales:", error);
        res.status(500).json({ error: "No se pudieron cargar las analíticas" });
    }
};
