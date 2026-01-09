import express from 'express';
import { getRiskHistory, saveRiskAssessment, runAdvancedRiskAnalysis, updateRiskFeedback } from '../controllers/riskController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/:patientId', getRiskHistory);
router.get('/:patientId/analysis', runAdvancedRiskAnalysis);
router.post('/', saveRiskAssessment);
router.patch('/:assessmentId/feedback', updateRiskFeedback);

export default router;
