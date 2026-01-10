import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { query } from '../database/db.js';

const CSV_PATH = path.resolve(process.cwd(), 'data_kaggle/healthcare_dataset.csv');
const LIMIT = 10000;
const BATCH_SIZE = 500;

async function fastImport() {
    console.log(`🚀 Iniciando IMPORTACIÓN VELOZ (${LIMIT} registros)...`);

    // Cleanup de Learning Cohort anterior para evitar duplicados masivos
    await query("DELETE FROM patients WHERE risk_score = 0");
    console.log("🧹 Cohorte de aprendizaje limpiada.");

    const patients = [];
    let count = 0;

    const stream = fs.createReadStream(CSV_PATH).pipe(csv());

    for await (const row of stream) {
        if (count >= LIMIT) break;

        patients.push(row);
        count++;

        if (patients.length >= BATCH_SIZE) {
            await processBatch(patients.splice(0, patients.length));
            process.stdout.write(`\r⚡ Procesados: ${count}/${LIMIT}`);
        }
    }

    if (patients.length > 0) {
        await processBatch(patients);
    }

    console.log("\n✅ Importación Masiva Completada.");
    process.exit(0);
}

async function processBatch(batch) {
    // 1. Bulk Insert Patients
    // Construct query: VALUES ($1, $2...), ($X, $Y...)
    // Postgres params limit ~65535. 500 * ~7 params = 3500. Safe.

    const values = [];
    const placeholders = [];
    let paramIdx = 1;

    batch.forEach(row => {
        const nameParts = row.Name.split(' ');
        const first = nameParts[0];
        const last = nameParts.slice(1).join(' ') || 'S/A';
        const gender = row.Gender === 'Male' ? 'M' : 'F';

        values.push(
            first, last, parseInt(row.Age), gender,
            row['Insurance Provider'], row['Medical Condition'],
            Math.floor(Math.random() * 5) + 1 // Vulnerability
        );
        placeholders.push(`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5}, $${paramIdx + 6})`);
        paramIdx += 7;
    });

    const pQuery = `
        INSERT INTO patients (first_name, last_name, age, gender, insurance, primary_condition, social_vulnerability)
        VALUES ${placeholders.join(', ')}
        RETURNING id
    `;

    const pRes = await query(pQuery, values);
    const patientIds = pRes.rows.map(r => r.id);

    // 2. Bulk Insert Events (Admissions with Outcome)
    const eventValues = [];
    const eventPlaceholders = [];
    paramIdx = 1;

    batch.forEach((row, i) => {
        const pid = patientIds[i];
        eventValues.push(
            pid,
            row['Admission Type'].toLowerCase() === 'emergency' ? 'internacion' : 'consulta',
            row['Date of Admission'],
            `OUTCOME: ${row['Test Results']}`
        );
        eventPlaceholders.push(`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3})`);
        paramIdx += 4;
    });

    const eQuery = `
        INSERT INTO clinical_events (patient_id, type, date, notes)
        VALUES ${eventPlaceholders.join(', ')}
    `;
    await query(eQuery, eventValues);
}

fastImport();
