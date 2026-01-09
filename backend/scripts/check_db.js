import { query } from '../database/db.js';

async function check() {
    try {
        const info = await query("SELECT current_database(), current_schema()");
        console.log("DB Context:", info.rows[0]);
        const res = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log("Tablas encontradas:", res.rows.map(t => t.table_name));
    } catch (err) {
        console.error("Error connecting to DB:", err);
    } finally {
        process.exit();
    }
}

check();
