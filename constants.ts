import { Patient, RiskLevel, GlobalOutcomes } from './types';

export const OUTCOMES_DATA: GlobalOutcomes = {
  hospitalizationsAvoided: 42,
  readmissionsReducedPercentage: 18.5,
  estimatedSavings: 125000,
  activePatients: 2450,
  criticalInterventions: 156
};

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'P-1024',
    name: 'Roberto Gómez',
    age: 68,
    gender: 'M',
    conditions: ['Insuficiencia Cardíaca', 'HTA', 'DM2'],
    riskLevel: RiskLevel.CRITICAL,
    riskScore: 88,
    riskTrend: 'WORSENING',
    riskDrivers: ['Internación previa (<60d)', 'Aumento de peso (+5kg)', 'Polifarmacia (Riesgo Renal)'],
    careGaps: [],
    lastEncounter: '2023-10-15',
    nextScheduled: '2023-10-25',
    lastPrescriptionDate: '2023-10-15',
    insurance: 'OSDE 410',
    feve: 35,
    egfr: 38, // Low eGFR specifically for polypharmacy interaction check
    baseline: {
      weight: 82.0,
      creatinine: 1.1,
      feve: 40,
      bnp: 450
    },
    creatinine: [
      { date: '2023-01-10', value: 1.1, unit: 'mg/dL', refRange: '0.7-1.2' },
      { date: '2023-10-15', value: 1.9, unit: 'mg/dL', refRange: '0.7-1.2' },
    ],
    hba1c: [
      { date: '2023-10-15', value: 8.4, unit: '%', refRange: '<7.0' },
    ],
    bnp: [
      { date: '2023-10-15', value: 1250, unit: 'pg/mL', refRange: '<100' },
    ],
    weight: [
      { date: '2023-10-01', value: 82.0, unit: 'kg', refRange: '' },
      { date: '2023-10-15', value: 87.0, unit: 'kg', refRange: '' },
    ],
    medications: [
      { id: 'm1', name: 'Enalapril', dose: '10mg', frequency: 'BID', startDate: '2020-01-01', renalAdjustmentNeeded: true, interactionRisk: false, active: true },
      { id: 'm2', name: 'Furosemida', dose: '40mg', frequency: 'QD', startDate: '2021-03-15', renalAdjustmentNeeded: false, interactionRisk: true, active: true },
      { id: 'm3', name: 'Spironolactone', dose: '25mg', frequency: 'QD', startDate: '2023-08-20', renalAdjustmentNeeded: true, interactionRisk: true, active: true },
      { id: 'm4', name: 'Metformina', dose: '850mg', frequency: 'BID', startDate: '2019-05-10', renalAdjustmentNeeded: true, interactionRisk: false, active: true },
    ],
    history: [
      { id: 'e1', date: '2023-10-15', type: 'Consultation', description: 'Disnea clase funcional III. Edemas MMII ++.' },
      { id: 'e2', date: '2023-08-18', type: 'Hospitalization', description: 'Internación por descompensación de IC.' },
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
    riskTrend: 'STABLE',
    riskDrivers: ['POLIFARMACIA CRÍTICA (8 fármacos)', 'Riesgo de caídas', 'Duplicidad terapéutica'],
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
      { id: 'cm1', name: 'Enalapril', dose: '20mg', frequency: 'BID', startDate: '2015', renalAdjustmentNeeded: false, interactionRisk: true, active: true },
      { id: 'cm2', name: 'Amlodipina', dose: '10mg', frequency: 'QD', startDate: '2018', renalAdjustmentNeeded: false, interactionRisk: false, active: true },
      { id: 'cm3', name: 'Alprazolam', dose: '1mg', frequency: 'Noche', startDate: '2019', renalAdjustmentNeeded: true, interactionRisk: true, active: true },
      { id: 'cm4', name: 'Clonazepam', dose: '0.5mg', frequency: 'SOS', startDate: '2021', renalAdjustmentNeeded: false, interactionRisk: true, active: true }, // Duplicidad Benzodiazepina
      { id: 'cm5', name: 'Diclofenac', dose: '75mg', frequency: 'PRN', startDate: '2022', renalAdjustmentNeeded: true, interactionRisk: true, active: true }, // Riesgo con HTA/Renal
      { id: 'cm6', name: 'Omeprazol', dose: '20mg', frequency: 'QD', startDate: '2020', renalAdjustmentNeeded: false, interactionRisk: false, active: true },
      { id: 'cm7', name: 'Atorvastatina', dose: '20mg', frequency: 'Noche', startDate: '2019', renalAdjustmentNeeded: false, interactionRisk: false, active: true },
      { id: 'cm8', name: 'Tramadol', dose: '50mg', frequency: 'PRN', startDate: '2023', renalAdjustmentNeeded: false, interactionRisk: true, active: true },
    ],
    history: [
       { id: 'ce1', date: '2023-09-20', type: 'Consultation', description: 'Consulta por dolor lumbar crónico.' }
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
    riskTrend: 'STABLE', 
    riskDrivers: ['RIESGO POR SILENCIO CLÍNICO', 'Sin receta activa (>6m)', 'Abandono de tratamiento'],
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
    medications: [
      { id: 'm99', name: 'Tiotropio+Olodaterol', dose: 'Respimat', frequency: 'QD', startDate: '2022-01-01', renalAdjustmentNeeded: false, interactionRisk: false, active: true },
    ],
    history: [
       { id: 'e99', date: '2023-02-10', type: 'Consultation', description: 'Control anual. Estable.' },
       { id: 'e98', date: '2022-06-15', type: 'Hospitalization', description: 'Neumonía adquirida en comunidad.' }
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
    riskTrend: 'IMPROVING',
    riskDrivers: ['Control metabólico adecuado'],
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
    history: []
  }
];