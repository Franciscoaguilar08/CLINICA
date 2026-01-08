
export enum RiskLevel {
  CRITICAL = 'CRITICAL', // Riesgo inminente o falta de cobertura crítica
  HIGH = 'HIGH', // Riesgo de internación < 30 días
  MEDIUM = 'MEDIUM', // Riesgo de descompensación < 90 días
  LOW = 'LOW', // Estable, control rutinario
}

export type RiskTrend = 'IMPROVING' | 'STABLE' | 'WORSENING';

export type CareGap = 'LOST_TO_FOLLOW_UP' | 'NO_ACTIVE_SCRIPT' | 'MISSED_APPOINTMENT' | 'DATA_MISSING';

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
  date: string;
  type: 'Hospitalization' | 'ER Visit' | 'Consultation' | 'Medication Change' | 'Missed Appointment';
  description: string;
}

// Estructura para explicar el riesgo (Explainable AI)
export interface RiskFactor {
  factor: string; // e.g., "Aumento de Creatinina"
  contribution: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string; // "Desviación del 30% respecto al baseline"
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
  conditions: string[]; // e.g., ['IC', 'DM2', 'HTA']
  
  // Stratification & Explainability
  riskLevel: RiskLevel;
  riskScore: number; // 0-100
  riskTrend: RiskTrend;
  riskDrivers: string[]; // Top 3 factors explaining the score (SHAP-style summary)
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
  history: ClinicalEvent[];
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
