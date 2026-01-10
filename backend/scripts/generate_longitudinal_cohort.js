import { query } from '../database/db.js';
// Custom random helper since we might not have faker installed

// Custom random helper since we might not have faker installed
const random = {
    int: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    float: (min, max) => Math.random() * (max - min) + min,
    element: (arr) => arr[Math.floor(Math.random() * arr.length)],
    date: (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
};

const BATCH_SIZE = 500;
const TOTAL_PATIENTS = 5000; // Generates ~5 events per patient = 25,000 records

async function generateLongitudinalCohort() {
    console.log(`⏳ Iniciando Generación Longitudinal (Simulación Synthea-lite)...`);
    console.log(`🎯 Objetivo: ${TOTAL_PATIENTS} pacientes con historia de 5 años.`);

    let patientsProcessed = 0;

    while (patientsProcessed < TOTAL_PATIENTS) {
        const batchPatients = [];
        const batchEvents = [];
        const batchVitals = [];

        for (let i = 0; i < BATCH_SIZE; i++) {
            // 1. Create Patient Profile
            const age = random.int(30, 85);
            const isDiabetic = Math.random() > 0.7; // 30% chance of diabetes storyline
            const gender = Math.random() > 0.5 ? 'M' : 'F';
            const startYear = 2020;

            // "Storyline": Deteriorating health?
            const isDeteriorating = isDiabetic && Math.random() > 0.5;

            batchPatients.push({
                idx: i,
                first: `SimUser${patientsProcessed + i}`,
                last: isDiabetic ? 'Diabetic' : 'Healthy',
                age: age,
                gender: gender,
                insurance: random.element(['Medicare', 'BlueCross', 'Private']),
                condition: isDiabetic ? 'Diabetes Type 2' : 'Hypertension',
                vulnerability: random.int(1, 4)
            });

            // 2. Generate History (3-5 years)
            let currentGlucose = isDiabetic ? 130 : 90;
            let currentCreatinine = 0.9;

            // Generate 3 to 8 visits per patient
            const numVisits = random.int(3, 8);

            // "Storyline": Chaos Factor (Realism)
            const adherence = Math.random(); // 0.0 - 1.0 (1.0 = perfect patient)
            const isCrisisProne = Math.random() > 0.8; // 20% chances of acute events

            for (let v = 0; v < numVisits; v++) {
                const visitDate = new Date(startYear + v, random.int(0, 11), random.int(1, 28));

                // CHAOS LOGIC:
                // If low adherence, disease progresses 3x faster
                let progressionFactor = adherence < 0.5 ? 3.0 : 0.5;

                if (isDeteriorating) {
                    currentGlucose += random.int(5, 15) * progressionFactor;
                    currentCreatinine += random.float(0.05, 0.1) * progressionFactor;
                } else {
                    // Even "stable" patients fluctuate
                    currentGlucose += random.int(-10, 10);
                }

                // Acute Event (The "Weekend Binge" or "Missed Meds")
                if (isCrisisProne && Math.random() > 0.7) {
                    currentGlucose += 80; // Massive spike
                    currentCreatinine += 0.4;
                }

                // Lab Result (Vital)
                batchVitals.push({
                    pIdx: i,
                    type: 'glucose',
                    value: Math.round(currentGlucose),
                    date: visitDate
                });

                batchVitals.push({
                    pIdx: i,
                    type: 'creatinine',
                    value: parseFloat(currentCreatinine.toFixed(2)),
                    date: visitDate
                });

                // Clinical Event (Outcome check)
                let note = "Routine Checkup";
                if (currentGlucose > 180) note = "OUTCOME: Abnormal - Hyperglycemia detected";
                if (currentCreatinine > 1.5) note = "OUTCOME: Abnormal - Kidney strain suspect";

                batchEvents.push({
                    pIdx: i,
                    type: 'consulta',
                    date: visitDate,
                    notes: note
                });
            }
        }

        // 3. Bulk Insert
        await saveBatch(batchPatients, batchEvents, batchVitals);
        patientsProcessed += BATCH_SIZE;
        process.stdout.write(`\r📅 Historia generada para: ${patientsProcessed}/${TOTAL_PATIENTS} pacientes`);
    }

    console.log("\n✅ Cohorte Longitudinal Creada.");
    process.exit(0);
}

async function saveBatch(patients, events, vitals) {
    // Insert Patients
    const pValues = [];
    const pPlaceholders = [];
    patients.forEach((p, idx) => {
        const offset = idx * 7;
        pValues.push(p.first, p.last, p.age, p.gender, p.insurance, p.condition, p.vulnerability);
        pPlaceholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`);
    });

    const pQuery = `
        INSERT INTO patients (first_name, last_name, age, gender, insurance, primary_condition, social_vulnerability)
        VALUES ${pPlaceholders.join(', ')}
        RETURNING id
    `;
    const pRes = await query(pQuery, pValues);
    const ids = pRes.rows.map(r => r.id);

    // Insert Events & Vitals
    // (Mapping back simulated index to real DB ID)
    const eValues = [];
    const ePlaceholders = [];
    let eOffset = 0;

    events.forEach(e => {
        const pid = ids[e.pIdx];
        eValues.push(pid, e.type, e.date, e.notes);
        ePlaceholders.push(`($${eOffset + 1}, $${eOffset + 2}, $${eOffset + 3}, $${eOffset + 4})`);
        eOffset += 4;
    });

    // Also populate measurements table for graphs
    const mValues = [];
    const mPlaceholders = [];
    let mOffset = 0;

    vitals.forEach(v => {
        const pid = ids[v.pIdx];
        mValues.push(pid, v.type, v.value, 'mg/dL', v.date);
        mPlaceholders.push(`($${mOffset + 1}, $${mOffset + 2}, $${mOffset + 3}, $${mOffset + 4}, $${mOffset + 5})`);
        mOffset += 5;
    });

    if (eValues.length > 0) {
        await query(`INSERT INTO clinical_events (patient_id, type, date, notes) VALUES ${ePlaceholders.join(', ')}`, eValues);
    }

    if (mValues.length > 0) {
        await query(`INSERT INTO clinical_measurements (patient_id, type, value, unit, date) VALUES ${mPlaceholders.join(', ')}`, mValues);
    }
}

generateLongitudinalCohort();
