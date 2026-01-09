import express from 'express';
import { getPatients, createPatient, getPatientById } from '../controllers/patientController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', getPatients);
router.post('/', createPatient);
router.get('/:id', getPatientById);

export default router;
