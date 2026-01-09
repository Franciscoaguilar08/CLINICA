import { query } from '../database/db.js';

async function debug() {
    try {
        const info = await query("SELECT current_database(), current_schema()");
        console.log("Context:", info.rows[0]);

        const cols = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'patients'");
        console.log("Columns:", cols.rows.map(c => c.column_name));
    } catch (err) {
        console.error("Test Select: FAILED -", err.message);
    } finally {
        process.exit();
    }
}

debug();
