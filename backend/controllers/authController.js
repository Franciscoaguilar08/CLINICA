import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../database/db.js';

// Registro de usuario (Médico/Admin)
export const register = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ error: "Faltan datos obligatorios" });
        }

        // Hash de contraseña
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const result = await query(
            'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
            [email, passwordHash, role]
        );

        res.status(201).json({ message: "Usuario creado", user: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') { // Código Postgres para unique_violation
            return res.status(409).json({ error: "El email ya está registrado" });
        }
        console.error("Error en registro:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// Login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }

        // Generar Token
        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            message: "Login exitoso",
            token,
            user: { id: user.id, email: user.email, role: user.role }
        });

    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
