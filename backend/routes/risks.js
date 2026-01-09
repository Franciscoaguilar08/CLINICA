import express from 'express';
import { getRiskHistory, saveRiskAssessment } from '../controllers/riskController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/:patientId', getRiskHistory);
router.post('/', saveRiskAssessment);

export default router;
