import express from 'express';
import { getMeasurementsByPatient, createMeasurement } from '../controllers/measurementController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/:patientId', getMeasurementsByPatient);
router.post('/', createMeasurement);

export default router;
