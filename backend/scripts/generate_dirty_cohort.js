import pkg from 'pg';
const { Pool } = pkg;
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const FIRST_NAMES = ["Maria", "Juan", "Jose", "Carlos", "Luis", "Ana", "Laura", "Pedro", "Sofia", "Miguel", "Lucia", "Elena", "Diego", "Valentina", "Camila", "Mateo", "Santiago", "Daniel", "Gabriela", "Fernando"];
const LAST_NAMES = ["Garcia", "Rodriguez", "Gonzalez", "Fernandez", "Lopez", "Martinez", "Sanchez", "Perez", "Gomez", "Martin", "Jimenez", "Ruiz", "Hernandez", "Diaz", "Moreno", "Muñoz", "Alvarez", "Romero", "Alonso", "Gutierrez"];
const CONDITIONS = ["Diabetes", "Hipertension", "EPOC", "Insuficiencia Cardiaca", "Asma", "Obesidad", "Renal Cronica", "Sano"];

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function generateCohort() {
    const client = await pool.connect();
    try {
        console.log("🌱 SEEDING DIRTY COHORT (2,000 Patients)...");

        await client.query('BEGIN');

        for (let i = 0; i < 2000; i++) {
            const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
            const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
            const fullName = `${firstName} ${lastName}`; // Use this as name if needed, but schema splits it
            const age = Math.floor(Math.random() * (90 - 20) + 20);
            const gender = Math.random() > 0.5 ? 'F' : 'M';
            const condition = CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)];
            const socialVuln = Math.floor(Math.random() * 5) + 1; // 1-5

            // "Dirty" Factors
            const isGhost = Math.random() < 0.15; // 15% Ghosts
            const isMissingData = Math.random() < 0.20; // 20% Missing Vitals

            // Admission Date
            const admissionDate = isGhost
                ? randomDate(new Date(2020, 0, 1), new Date(2023, 0, 1)) // Old date
                : randomDate(new Date(2024, 0, 1), new Date()); // Recent

            // Insert Patient
            const res = await client.query(`
                INSERT INTO patients (first_name, last_name, age, gender, primary_condition, social_vulnerability, admission_date, insurance)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id
            `, [firstName, lastName, age, gender, condition, socialVuln, admissionDate, Math.random() > 0.3 ? 'Obras Social' : 'Particular']);
            const pid = res.rows[0].id;

            // Generate Clinical History (unless "Missing Data" is extreme)
            if (!isMissingData) {
                // Add Medications (Random)
                const numMeds = Math.floor(Math.random() * 5);
                for (let m = 0; m < numMeds; m++) {
                    await client.query(
                        "INSERT INTO medications (patient_id, name) VALUES ($1, $2)",
                        [pid, `Medication_${m}`] // Placeholder names for now
                    );
                }

                // Add Vitals (Sometimes missing one)
                if (Math.random() > 0.1) {
                    await client.query(
                        "INSERT INTO clinical_measurements (patient_id, type, value, unit) VALUES ($1, 'weight', $2, 'kg')",
                        [pid, Math.floor(Math.random() * 50) + 50]
                    );
                }
                if (Math.random() > 0.1) {
                    await client.query(
                        "INSERT INTO clinical_measurements (patient_id, type, value, unit) VALUES ($1, 'creatinine', $2, 'mg/dL')",
                        [pid, (Math.random() * 2 + 0.5).toFixed(2)]
                    );
                }
            }

            // Add Clinical Events (Hospitalizations etc)
            // Ghosts have NO recent events
            if (!isGhost && Math.random() > 0.5) {
                await client.query(
                    "INSERT INTO clinical_events (patient_id, type, date, notes) VALUES ($1, 'consult', $2, 'Routine checkup')",
                    [pid, randomDate(new Date(2024, 0, 1), new Date())]
                );
            }

            if (i % 200 === 0) process.stdout.write('.');
        }

        await client.query('COMMIT');
        console.log("\n✅ Generated 2,000 Dirty Patients.");

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("\n❌ Error generating cohort:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

generateCohort();
