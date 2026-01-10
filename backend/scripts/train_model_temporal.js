import { query } from '../database/db.js';
import fs from 'fs';
import path from 'path';

// Entrenador Temporal: Busca pendientes (slopes) y aceleración de enfermedad
async function trainTemporalModel() {
    console.log("⏳ Iniciando Entrenamiento Temporal (Phase 2)...");

    try {
        // 1. Obtener Series de Tiempo de la Cohorte Sintética
        // Buscamos pacientes con al menos 3 mediciones para calcular tendencia
        const timeSeriesData = await query(`
            SELECT 
                p.id,
                p.primary_condition,
                json_agg(json_build_object('val', cm.value, 'date', cm.date)) as glucose_history,
                MAX(ce.notes) as outcome -- Buscamos si hubo evento adverso final
            FROM patients p
            JOIN clinical_measurements cm ON p.id = cm.patient_id
            LEFT JOIN clinical_events ce ON p.id = ce.patient_id
            WHERE cm.type = 'glucose'
            AND p.first_name LIKE 'SimUser%' -- Solo entrenar con la cohorte longitudinal
            GROUP BY p.id, p.primary_condition
            HAVING count(cm.id) >= 3
        `);

        console.log(`📊 Pacientes con Historia Longitudinal: ${timeSeriesData.rows.length}`);

        // 2. Extraer Features Temporales (Slope Calculation)
        let deterioratingPatterns = 0;
        let stablePatterns = 0;

        const trainingSet = timeSeriesData.rows.map(row => {
            // Sort by date
            const history = row.glucose_history.sort((a, b) => new Date(a.date) - new Date(b.date));

            // Calculate Slope (Simple Linear Regression approximation)
            const n = history.length;
            const first = history[0].val;
            const last = history[n - 1].val;
            const slope = (last - first) / n; // mg/dL per visit avg change

            // Check Outcome
            const badOutcome = row.outcome && row.outcome.includes('OUTCOME: Abnormal');

            if (badOutcome && slope > 0) deterioratingPatterns++;
            if (!badOutcome && slope <= 0) stablePatterns++;

            return { slope, badOutcome };
        });

        console.log(`📈 Patrones Detectados:`);
        console.log(`   - Deterioro Rápido (Slope > 0 + Outcome): ${deterioratingPatterns}`);
        console.log(`   - Estabilidad (Slope <= 0 + No Outcome): ${stablePatterns}`);

        // 3. Crear/Actualizar Modelo Temporal
        const modelPath = path.resolve(process.cwd(), '../models/temporal_risk_engine.json');

        const model = {
            version: "2.0-temporal",
            description: "Modelo de detección de tendencias longitudinales",
            features: ["glucose_slope_3y", "creatinine_slope_3y"],
            thresholds: {
                // Si la pendiente de glucosa es > 10 mg/dL por visita, riesgo alto
                glucose_slope_alert: 10.0,
                // Peso que se le da a la tendencia vs el valor estático
                temporal_weight: 0.85
            },
            stats: {
                trained_on: timeSeriesData.rows.length,
                deterioration_rate: (deterioratingPatterns / timeSeriesData.rows.length).toFixed(2)
            }
        };

        fs.writeFileSync(modelPath, JSON.stringify(model, null, 4));
        console.log("✅ Modelo Temporal Generado: temporal_risk_engine.json");

    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        process.exit(0);
    }
}

trainTemporalModel();
