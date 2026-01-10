import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { query } from '../database/db.js';

const CSV_PATH = path.resolve(process.cwd(), 'data_kaggle/healthcare_dataset.csv');
const LIMIT = 10000; // Scaled to 10k for deeper training

async function importData() {
    console.log(`[Import] Iniciando importación desde: ${CSV_PATH}`);

    try {
        const info = await query("SELECT current_database(), current_schema()");
        console.log("[Import] DB Context:", info.rows[0]);
        const test = await query("SELECT 1 FROM patients LIMIT 1");
        console.log("[Import] Conexión a 'patients' verificada.");
    } catch (e) {
        console.error("[Import] Error Crítico de Conexión:", e.message);
        process.exit(1);
    }

    let count = 0;
    const results = [];

    fs.createReadStream(CSV_PATH)
        .pipe(csv())
        .on('data', (data) => {
            if (count < LIMIT) {
                results.push(data);
                count++;
            }
        })
        .on('end', async () => {
            console.log(`[Import] Procesando ${results.length} registros...`);

            for (const row of results) {
                try {
                    const nameParts = row.Name.split(' ');
                    const first_name = nameParts[0];
                    const last_name = nameParts.slice(1).join(' ') || 'S/A';
                    const gender = row.Gender === 'Male' ? 'M' : 'F';

                    // 1. Insertar Paciente
                    const pRes = await query(`
                        INSERT INTO patients (first_name, last_name, age, gender, insurance, primary_condition, social_vulnerability)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                        RETURNING id
                    `, [
                        first_name,
                        last_name,
                        parseInt(row.Age),
                        gender,
                        row['Insurance Provider'],
                        row['Medical Condition'],
                        Math.floor(Math.random() * 5) + 1 // SDOH aleatorio para simulación
                    ]);

                    const patientId = pRes.rows[0].id;

                    // 2. Insertar Evento de Admisión
                    await query(`
                        INSERT INTO clinical_events (patient_id, type, date, notes)
                        VALUES ($1, $2, $3, $4)
                    `, [
                        patientId,
                        row['Admission Type'].toLowerCase() === 'emergency' ? 'internacion' : 'consulta',
                        row['Date of Admission'],
                        `Admisión en ${row.Hospital}. Doctor: ${row.Doctor}. OUTCOME: ${row['Test Results']}`
                    ]);

                    // 3. Insertar Medicación
                    await query(`
                        INSERT INTO medications (patient_id, name, dosage, is_active)
                        VALUES ($1, $2, $3, $4)
                    `, [
                        patientId,
                        row.Medication,
                        'Según protocolo',
                        true
                    ]);

                } catch (err) {
                    console.error(`[Import] Error en registro ${row.Name}:`, err.message);
                }

                if (results.indexOf(row) % 100 === 0) {
                    console.log(`[Import] Progreso: ${results.indexOf(row)}/${results.length}...`);
                }
            }
            console.log("[Import] Finalizado exitosamente. 10000 registros procesados.");
            process.exit(0);
        });
}

importData();
