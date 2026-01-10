import pkg from 'pg';
const { Pool } = pkg;
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runAudit() {
    console.log("🔍 Iniciando Auditoría del Sistema...");
    const client = await pool.connect();
    try {
        // 1. Check Totals
        const totalRes = await client.query('SELECT COUNT(*) FROM patients');
        const total = parseInt(totalRes.rows[0].count);
        console.log(`📋 Total Pacientes: ${total}`);

        // 2. Check Risk Segments
        const activeRes = await client.query('SELECT COUNT(*) FROM patients WHERE risk_score > 0');
        const learningRes = await client.query('SELECT COUNT(*) FROM patients WHERE risk_score = 0 OR risk_score IS NULL');

        console.log(`✅ Cohorte Activa (Score > 0): ${activeRes.rows[0].count}`);
        console.log(`🧠 Cohorte Aprendizaje (Score = 0): ${learningRes.rows[0].count}`);

        if (parseInt(activeRes.rows[0].count) !== 50) {
            console.warn("⚠️ ALERTA: La cohorte activa no es exactamente 50.");
        }

        // 3. Check Recent Assessments
        const assessmentsRes = await client.query('SELECT COUNT(*) FROM risk_assessments WHERE created_at > NOW() - INTERVAL \'24 hours\'');
        console.log(`📊 Evaluaciones de Riesgo (Últimas 24h): ${assessmentsRes.rows[0].count}`);

        // 4. DB Health
        const tableRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log("🗄️ Tablas detectadas:", tableRes.rows.map(r => r.table_name).join(', '));

    } catch (err) {
        console.error("❌ FALLO CRÍTICO EN AUDITORÍA:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

runAudit();
