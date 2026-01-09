import express from 'express';
import { getEventsByPatient, createEvent } from '../controllers/eventController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/:patientId', getEventsByPatient);
router.post('/', createEvent);

export default router;
