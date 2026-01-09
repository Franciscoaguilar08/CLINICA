import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = pg;

const createAdmin = async () => {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const email = 'admin@clinica.com';
        const password = 'admin123';

        console.log(`🔐 Creando usuario admin: ${email}`);

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const client = await pool.connect();

        // Check if exists
        const check = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (check.rows.length > 0) {
            console.log('⚠️ El usuario admin ya existe.');
        } else {
            await client.query(
                'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)',
                [email, passwordHash, 'admin']
            );
            console.log('✅ Usuario Admin creado exitosamente.');
        }

        client.release();
    } catch (err) {
        console.error('❌ Error creando admin:', err);
    } finally {
        await pool.end();
    }
};

createAdmin();
