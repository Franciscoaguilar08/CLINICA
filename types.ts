
export enum RiskLevel {
  CRITICAL = 'CRITICAL', // Riesgo inminente o falta de cobertura crítica
  HIGH = 'HIGH', // Riesgo de internación < 30 días
  MEDIUM = 'MEDIUM', // Riesgo de descompensación < 90 días
  LOW = 'LOW', // Estable, control rutinario
}

export type RiskTrend = 'IMPROVING' | 'STABLE' | 'WORSENING';

export type CareGap = 'LOST_TO_FOLLOW_UP' | 'NO_ACTIVE_SCRIPT' | 'MISSED_APPOINTMENT' | 'DATA_MISSING';

// Definición estricta del Label para el modelo predictivo
export type PredictionLabel = 'HOSPITALIZATION_30D' | 'READMISSION_90D' | 'MORTALITY_1Y';

export interface ModelMetrics {
  version: string;
  trainingPeriod: string; // e.g., "2019-2022"
  validationPeriod: string; // e.g., "2023 (Temporal Split)"
  auc: number;
  sensitivity: number; // Recall
  specificity: number;
  ppv: number; // Precision
  alertRate: number; // % of population flagged
  nTotal: number;
}

export interface Medication {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  startDate: string;
  renalAdjustmentNeeded: boolean;
  interactionRisk: boolean;
  active: boolean;
}

export interface LabResult {
  date: string;
  value: number;
  unit: string;
  refRange: string;
}

export interface ClinicalEvent {
  id: string;
  date: string; // ISO 8601
  type: 'Hospitalization' | 'ER Visit' | 'Consultation' | 'Medication Change' | 'Missed Appointment' | 'Lab';
  description: string;
  value?: string; // Para mostrar datos crudos en timeline
}

// Estructura para explicar el riesgo (Explainable AI / SHAP)
export interface RiskFactor {
  factor: string; // Feature Name
  contribution: 'HIGH' | 'MEDIUM' | 'LOW';
  value: number; // SHAP value simulado
  description: string; // Traducción clínica
}

// Datos basales del paciente para comparación longitudinal (Self-Comparison)
export interface PatientBaseline {
  weight: number;
  creatinine: number;
  feve?: number;
  bnp?: number;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  conditions: string[]; 
  
  // Stratification & Explainability
  riskLevel: RiskLevel;
  riskScore: number; // Probability 0-100% for the specific Label
  predictionLabel: PredictionLabel; // Qué estamos prediciendo
  riskTrend: RiskTrend;
  riskDrivers: RiskFactor[]; // Ahora usa la interfaz RiskFactor más detallada
  careGaps: CareGap[]; 

  // Logistics
  lastEncounter: string;
  nextScheduled: string | null;
  lastPrescriptionDate: string; 
  insurance: string;
  
  // Clinical Markers & Baseline
  baseline: PatientBaseline;
  creatinine: LabResult[];
  hba1c: LabResult[];
  bnp: LabResult[]; 
  weight: LabResult[]; 
  feve: number; 
  egfr: number; 

  medications: Medication[];
  history: ClinicalEvent[]; // Timeline completa
}

// Business Value Metrics
export interface GlobalOutcomes {
  hospitalizationsAvoided: number;
  readmissionsReducedPercentage: number;
  estimatedSavings: number; // USD/Local Currency
  activePatients: number;
  criticalInterventions: number;
}

// --- AbkInfo Types ---
export type AbkInfoState = 'IDLE' | 'PROCESSING' | 'COMPLETE';

export interface AbkLog {
  id: number;
  message: string;
  timestamp: string;
}
