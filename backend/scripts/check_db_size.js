import { query } from '../database/db.js';

async function checkSize() {
    try {
        const res = await query(`
            SELECT 
                relname as "Table",
                pg_size_pretty(pg_total_relation_size(relid)) as "Size",
                pg_total_relation_size(relid) as "Bytes"
            FROM pg_catalog.pg_statio_user_tables 
            WHERE relname IN ('patients', 'clinical_events', 'risk_assessments')
            ORDER BY pg_total_relation_size(relid) DESC;
        `);
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

checkSize();
