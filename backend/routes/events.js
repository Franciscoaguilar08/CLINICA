import express from 'express';
const router = express.Router();

router.get('/:patient_id', (req, res) => {
    res.json({ message: "Eventos del paciente " + req.params.patient_id });
});

export default router;
