import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { query } from '../database/db.js';

// Adjust path based on unzip structure
// Helper to find file recursively
function findFile(startPath, filter) {
    if (!fs.existsSync(startPath)) return null;
    const files = fs.readdirSync(startPath);
    for (let i = 0; i < files.length; i++) {
        const filename = path.join(startPath, files[i]);
        const stat = fs.lstatSync(filename);
        if (stat.isDirectory()) {
            const found = findFile(filename, filter);
            if (found) return found;
        } else if (filename.indexOf(filter) >= 0) {
            return filename;
        }
    }
    return null;
}

const FOUND_PATH = findFile(process.cwd(), 'diabetic_data.csv');
const CSV_PATH = FOUND_PATH || path.resolve(process.cwd(), 'dataset_diabetes/dataset_diabetes/diabetic_data.csv');
const BATCH_SIZE = 1000;

async function ingestUciDiabetes() {
    console.log(`🏥 Iniciando Ingesta REAL (UCI Diabetes Dataset)...`);

    if (!FOUND_PATH) {
        console.error("❌ Archivo 'diabetic_data.csv' no encontrado en subdirectorios.");
        process.exit(1);
    }
    console.log(`📂 Fuente Detectada: ${CSV_PATH}`);

    // Cleanup previous 'SimUser' traces if needed, or just append. 
    // We will append but ensure created_by is NULL so they are invisible.

    let count = 0;
    let batch = [];

    fs.createReadStream(CSV_PATH)
        .pipe(csv())
        .on('data', (row) => {
            batch.push(row);
            if (batch.length >= BATCH_SIZE) {
                processBatch(batch.splice(0, batch.length));
                count += BATCH_SIZE;
                if (count % 5000 === 0) process.stdout.write(`\r📥 Ingestados: ${count} registros...`);
            }
        })
        .on('end', async () => {
            if (batch.length > 0) await processBatch(batch);
            console.log(`\n✅ Carga Completa: ~${count} registros reales.`);
            process.exit(0);
        });
}

async function processBatch(rows) {
    const pValues = [];
    const pPlaceholders = [];
    let pOffset = 0;

    const eValues = [];
    const ePlaceholders = [];
    let eOffset = 0;

    // Helper for age mapping "[0-10)" -> 5
    const parseAge = (str) => {
        const match = str.match(/\[(\d+)-(\d+)\)/);
        return match ? (parseInt(match[1]) + parseInt(match[2])) / 2 : 55;
    };

    rows.forEach(row => {
        // --- 1. Map Patient ---
        // Using "RealPatient" prefix to distinguish from "SimUser"
        // Since dataset is de-identified, we generate generic names
        const randomID = Math.floor(Math.random() * 999999);
        const age = parseAge(row.age || '[50-60)');
        const gender = row.gender === 'Male' ? 'M' : 'F';

        pValues.push(
            `KaggleUser${randomID}`, // First
            `RealData`,             // Last
            age,
            gender,
            row.payer_code === '?' ? 'Unknown' : row.payer_code,
            'Diabetes', // Primary Condition (It's a diabetes dataset)
            Math.floor(Math.random() * 4) + 1 // Vulnerability (Simulated as missing in dataset)
        );
        pPlaceholders.push(`($${pOffset + 1}, $${pOffset + 2}, $${pOffset + 3}, $${pOffset + 4}, $${pOffset + 5}, $${pOffset + 6}, $${pOffset + 7})`);
        pOffset += 7;
    });

    try {
        const pQuery = `
            INSERT INTO patients (first_name, last_name, age, gender, insurance, primary_condition, social_vulnerability)
            VALUES ${pPlaceholders.join(', ')}
            RETURNING id
        `;
        const pRes = await query(pQuery, pValues);
        const ids = pRes.rows.map(r => r.id);

        // --- 2. Map Clinical Events (Admission + Outcome) ---
        rows.forEach((row, idx) => {
            const pid = ids[idx];
            const outcome = row.readmitted; // <30, >30, NO

            // Map Outcome to Notes for Training
            let note = `Admission ID: ${row.encounter_id}. Time in Hospital: ${row.time_in_hospital} days.`;
            if (outcome === '<30') note += " OUTCOME: Readmitted <30 days (High Risk)";
            else if (outcome === '>30') note += " OUTCOME: Readmitted >30 days";
            else note += " OUTCOME: No Readmission (Stable)";

            // Add complexity details
            note += ` | Labs: ${row.num_lab_procedures} | Meds: ${row.num_medications}`;

            eValues.push(pid, 'internacion', new Date(), note);
            ePlaceholders.push(`($${eOffset + 1}, $${eOffset + 2}, $${eOffset + 3}, $${eOffset + 4})`);
            eOffset += 4;
        });

        if (eValues.length > 0) {
            await query(`INSERT INTO clinical_events (patient_id, type, date, notes) VALUES ${ePlaceholders.join(', ')}`, eValues);
        }

    } catch (err) {
        console.error("Batch Error:", err.message);
    }
}

ingestUciDiabetes();
