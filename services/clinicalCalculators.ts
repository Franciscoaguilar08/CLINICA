/**
 * Clinical Calculators Service
 * Based on: 
 * - SAC (Sociedad Argentina de Cardiología) Guidelines for AF
 * - KDIGO/MDRD Standards for Chronic Kidney Disease
 */

import { Patient, ClinicalEvent } from '../types';

/**
 * CHA2DS2-VASc Score Calculation
 * Guidelines: ESC/SAC 2020 for Atrial Fibrillation
 */
export const calculateCHA2DS2VASc = (patient: Patient, history: ClinicalEvent[]): { score: number; risk: string; recommendation: string } => {
    let score = 0;
    const hxTypes = history.map(e => e.type.toLowerCase());
    const hxNotes = history.map(e => (e.description || '').toLowerCase());

    // C: Congestive heart failure (1 pt)
    if (hxNotes.some(n => n.includes('insuficiencia cardiaca') || n.includes('ic') || n.includes('fallo cardiaco'))) score += 1;

    // H: Hypertension (1 pt)
    if (hxNotes.some(n => n.includes('hta') || n.includes('hipertension'))) score += 1;

    // A2: Age >= 75 (2 pts)
    if (patient.age >= 75) score += 2;
    else if (patient.age >= 65) score += 1; // A: Age 65-74 (1 pt)

    // D: Diabetes mellitus (1 pt)
    if (hxNotes.some(n => n.includes('diabetes') || n.includes('dbm'))) score += 1;

    // S2: Stroke/TIA/Thromboembolism (2 pts)
    if (hxNotes.some(n => n.includes('acv') || n.includes('stroke') || n.includes('tia') || n.includes('isquemia'))) score += 2;

    // V: Vascular disease (MI, PAD, aortic plaque) (1 pt)
    if (hxNotes.some(n => n.includes('infarto') || n.includes('iam') || n.includes('vasculopatia'))) score += 1;

    // Sc: Sex category (female = 1 pt)
    if (patient.gender?.toLowerCase() === 'femenino' || patient.gender?.toLowerCase() === 'f') score += 1;

    let risk = 'Bajo';
    let recommendation = 'No requiere anticoagulación.';

    if (score >= 2) {
        risk = 'Alto';
        recommendation = 'Se recomienda anticoagulación oral (GPC SAC/AHA).';
    } else if (score === 1 && (patient.gender?.toLowerCase() !== 'femenino')) {
        risk = 'Moderado';
        recommendation = 'Considerar anticoagulación.';
    }

    return { score, risk, recommendation };
};

/**
 * MDRD GFR Equation (Estimated Glomerular Filtration Rate)
 * Standard: 175 x (Scr)^-1.154 x (Age)^-0.203 x (0.742 if female)
 */
export const calculateMDRD = (patient: Patient, creatinine: number): { gfr: number; stage: string; note: string } => {
    if (!creatinine || creatinine <= 0) return { gfr: 0, stage: 'N/A', note: 'Falta valor de creatinina' };

    let gfr = 175 * Math.pow(creatinine, -1.154) * Math.pow(patient.age, -0.203);

    if (patient.gender?.toLowerCase() === 'femenino' || patient.gender?.toLowerCase() === 'f') {
        gfr *= 0.742;
    }

    let stage = 'G1';
    let note = 'Normal o alto';

    if (gfr < 15) { stage = 'G5'; note = 'Fallo Renal (Dialisis)'; }
    else if (gfr < 30) { stage = 'G4'; note = 'Descenso Grave de la TFG'; }
    else if (gfr < 60) { stage = 'G3'; note = 'Descenso Moderado de la TFG'; }
    else if (gfr < 90) { stage = 'G2'; note = 'Descenso Leve de la TFG'; }

    return { gfr: Math.round(gfr), stage, note };
};
