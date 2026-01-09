import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Check de salud para Render (y para nosotros)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Backend funcionando correctamente' });
});

// Rutas
import authRoutes from './routes/auth.js';
import patientsRouter from './routes/patients.js';

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientsRouter);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
