
import { Patient, RiskLevel, GlobalOutcomes, ModelMetrics } from './types';

export const OUTCOMES_DATA: GlobalOutcomes = {
  hospitalizationsAvoided: 42,
  readmissionsReducedPercentage: 18.5,
  estimatedSavings: 125000,
  activePatients: 2450,
  criticalInterventions: 156
};

// Datos de validación del modelo (Simulados pero realistas)
export const MODEL_METRICS: ModelMetrics = {
  version: "v2.4.1 (XGBoost)",
  trainingPeriod: "Ene 2019 - Dic 2022",
  validationPeriod: "Ene 2023 - Dic 2023 (OOT)",
  auc: 0.84,
  sensitivity: 0.76, // De 100 que se internan, detectamos 76
  specificity: 0.88,
  ppv: 0.65, // De 100 alertas, 65 son reales (Aceptable para screening)
  alertRate: 12.4, // % de la población marcada como riesgo alto
  nTotal: 15400
};

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'P-1024',
    name: 'Roberto Gómez',
    age: 68,
    gender: 'M',
    conditions: ['Insuficiencia Cardíaca (CF III)', 'HTA', 'DM2'],
    riskLevel: RiskLevel.CRITICAL,
    riskScore: 88,
    predictionLabel: 'HOSPITALIZATION_30D',
    riskTrend: 'WORSENING',
    riskDrivers: [
        { factor: "Tiempo desde última internación", value: 0.8, contribution: 'HIGH', description: "Internación previa hace 58 días (<60d es predictor crítico)." },
        { factor: "Delta Peso", value: 0.5, contribution: 'MEDIUM', description: "Aumento de 5kg en 15 días." },
        { factor: "Interacción Fármaco-Renal", value: 0.4, contribution: 'MEDIUM', description: "Uso de AINE con eGFR < 40." }
    ],
    careGaps: [],
    lastEncounter: '2023-10-15',
    nextScheduled: '2023-10-25',
    lastPrescriptionDate: '2023-10-15',
    insurance: 'OSDE 410',
    feve: 35,
    egfr: 38,
    baseline: {
      weight: 82.0,
      creatinine: 1.1,
      feve: 40,
      bnp: 450
    },
    creatinine: [
      { date: '2023-01-10', value: 1.1, unit: 'mg/dL', refRange: '0.7-1.2' },
      { date: '2023-08-18', value: 1.5, unit: 'mg/dL', refRange: '0.7-1.2' }, // Durante internación
      { date: '2023-10-15', value: 1.9, unit: 'mg/dL', refRange: '0.7-1.2' },
    ],
    hba1c: [
      { date: '2023-10-15', value: 8.4, unit: '%', refRange: '<7.0' },
    ],
    bnp: [
      { date: '2023-01-10', value: 450, unit: 'pg/mL', refRange: '<100' },
      { date: '2023-10-15', value: 1250, unit: 'pg/mL', refRange: '<100' },
    ],
    weight: [
      { date: '2023-08-01', value: 82.0, unit: 'kg', refRange: '' },
      { date: '2023-10-01', value: 82.0, unit: 'kg', refRange: '' },
      { date: '2023-10-15', value: 87.0, unit: 'kg', refRange: '' },
    ],
    medications: [
      { id: 'm1', name: 'Enalapril', dose: '10mg', frequency: 'BID', startDate: '2020-01-01', renalAdjustmentNeeded: true, interactionRisk: false, active: true },
      { id: 'm2', name: 'Furosemida', dose: '40mg', frequency: 'QD', startDate: '2021-03-15', renalAdjustmentNeeded: false, interactionRisk: true, active: true },
      { id: 'm3', name: 'Spironolactone', dose: '25mg', frequency: 'QD', startDate: '2023-08-20', renalAdjustmentNeeded: true, interactionRisk: true, active: true },
    ],
    history: [
      { id: 'e1', date: '2023-01-10', type: 'Consultation', description: 'Control anual. Estable.', value: 'NYHA I' },
      { id: 'e2', date: '2023-08-18', type: 'Hospitalization', description: 'Internación por descompensación de IC.', value: '3 días' },
      { id: 'e3', date: '2023-08-21', type: 'Medication Change', description: 'Alta médica. Se agrega Espironolactona.', value: '' },
      { id: 'e4', date: '2023-10-15', type: 'Consultation', description: 'Urgencia: Disnea CF III + Edemas.', value: 'Pro-BNP 1250' },
    ]
  },
  {
    id: 'P-5055',
    name: 'Carmen Vega',
    age: 79,
    gender: 'F',
    conditions: ['HTA', 'Artrosis', 'Ansiedad'],
    riskLevel: RiskLevel.HIGH,
    riskScore: 72,
    predictionLabel: 'HOSPITALIZATION_30D',
    riskTrend: 'STABLE',
    riskDrivers: [
        { factor: "Carga de Polifarmacia", value: 0.9, contribution: 'HIGH', description: "8 fármacos activos (Score Beers alto)." },
        { factor: "Riesgo Caídas", value: 0.6, contribution: 'MEDIUM', description: "Uso concomitante de 2 Benzodiazepinas." },
        { factor: "Función Renal Limítrofe", value: 0.3, contribution: 'LOW', description: "eGFR 55 con uso de AINEs." }
    ],
    careGaps: [],
    lastEncounter: '2023-09-20',
    nextScheduled: '2023-11-20',
    lastPrescriptionDate: '2023-09-20',
    insurance: 'PAMI',
    feve: 60,
    egfr: 55,
    baseline: { weight: 65, creatinine: 0.9 },
    creatinine: [{ date: '2023-09-20', value: 1.1, unit: 'mg/dL', refRange: '0.7-1.2' }],
    hba1c: [],
    bnp: [],
    weight: [{ date: '2023-09-20', value: 65.0, unit: 'kg', refRange: '' }],
    medications: [
      { id: 'cm1', name: 'Enalapril', dose: '20mg', frequency: 'BID', startDate: '2015-01-01', renalAdjustmentNeeded: false, interactionRisk: true, active: true },
      { id: 'cm3', name: 'Alprazolam', dose: '1mg', frequency: 'Noche', startDate: '2019-06-01', renalAdjustmentNeeded: true, interactionRisk: true, active: true },
      { id: 'cm4', name: 'Clonazepam', dose: '0.5mg', frequency: 'SOS', startDate: '2021-02-15', renalAdjustmentNeeded: false, interactionRisk: true, active: true }, 
      { id: 'cm5', name: 'Diclofenac', dose: '75mg', frequency: 'PRN', startDate: '2022-11-10', renalAdjustmentNeeded: true, interactionRisk: true, active: true },
      { id: 'cm8', name: 'Tramadol', dose: '50mg', frequency: 'PRN', startDate: '2023-05-20', renalAdjustmentNeeded: false, interactionRisk: true, active: true },
    ],
    history: [
       { id: 'ce1', date: '2023-05-20', type: 'Consultation', description: 'Dolor lumbar. Se indica Tramadol.', value: 'EVA 7/10' },
       { id: 'ce2', date: '2023-09-20', type: 'Consultation', description: 'Control HTA. Refiere mareos matutinos.', value: 'TA 130/80' }
    ]
  },
  {
    id: 'P-9981',
    name: 'Mario Rossi',
    age: 74,
    gender: 'M',
    conditions: ['EPOC Severo', 'HTA'],
    riskLevel: RiskLevel.HIGH,
    riskScore: 78,
    predictionLabel: 'HOSPITALIZATION_30D',
    riskTrend: 'STABLE', 
    riskDrivers: [
        { factor: "Silencio Clínico (Abandono)", value: 0.95, contribution: 'HIGH', description: "Sin eventos clínicos ni recetas en >180 días." },
        { factor: "Adherencia Tratamiento", value: 0.7, contribution: 'HIGH', description: "No registra dispensa de inhaladores en 6 meses." }
    ],
    careGaps: ['LOST_TO_FOLLOW_UP', 'NO_ACTIVE_SCRIPT'],
    lastEncounter: '2023-02-10', 
    nextScheduled: null,
    lastPrescriptionDate: '2023-02-10', 
    insurance: 'PAMI',
    feve: 55,
    egfr: 60,
    baseline: {
      weight: 70.0,
      creatinine: 1.0
    },
    creatinine: [
       { date: '2023-02-10', value: 1.0, unit: 'mg/dL', refRange: '0.7-1.2' },
    ],
    hba1c: [],
    bnp: [],
    weight: [
       { date: '2023-02-10', value: 70.0, unit: 'kg', refRange: '' },
    ],
    medications: [], // Empty medications list reinforces "Ghost patient" status
    history: [
       { id: 'e98', date: '2022-06-15', type: 'Hospitalization', description: 'Neumonía adquirida en comunidad.', value: '7 días' },
       { id: 'e99', date: '2023-02-10', type: 'Consultation', description: 'Control anual. Estable.', value: '' },
    ]
  },
    {
    id: 'P-3099',
    name: 'Carlos Ruiz',
    age: 55,
    gender: 'M',
    conditions: ['DM2'],
    riskLevel: RiskLevel.LOW,
    riskScore: 15,
    predictionLabel: 'HOSPITALIZATION_30D',
    riskTrend: 'IMPROVING',
    riskDrivers: [
         { factor: "HbA1c Estable", value: -0.2, contribution: 'LOW', description: "Valores < 7.0% consistentemente." }
    ],
    careGaps: [],
    lastEncounter: '2023-10-01',
    nextScheduled: '2024-04-01',
    lastPrescriptionDate: '2023-10-01',
    insurance: 'Swiss Medical',
    feve: 65,
    egfr: 90,
    baseline: {
      weight: 78.0,
      creatinine: 0.9
    },
    creatinine: [],
    hba1c: [
        { date: '2022-10-10', value: 6.5, unit: '%', refRange: '<7.0' },
        { date: '2023-10-01', value: 6.4, unit: '%', refRange: '<7.0' },
    ],
    bnp: [],
    weight: [],
    medications: [
      { id: 'm7', name: 'Metformina', dose: '500mg', frequency: 'QD', startDate: '2022-01-01', renalAdjustmentNeeded: false, interactionRisk: false, active: true },
    ],
    history: [
        { id: 'h1', date: '2022-10-10', type: 'Lab', description: 'Control semestral', value: 'HbA1c 6.5' },
        { id: 'h2', date: '2023-10-01', type: 'Consultation', description: 'Control anual. Buen estado general.', value: '' }
    ]
  }
];
