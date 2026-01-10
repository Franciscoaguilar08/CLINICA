import { query } from '../database/db.js';
import fs from 'fs';
import path from 'path';

const sqlPath = process.argv[2];
if (!sqlPath) {
    console.error("Provide SQL file path");
    process.exit(1);
}

const sql = fs.readFileSync(path.resolve(process.cwd(), sqlPath), 'utf8');

async function run() {
    try {
        await query(sql);
        console.log("SQL executed successfully.");
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
