import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { Patient } from "../types";
import { calculateCHA2DS2VASc, calculateMDRD } from "./clinicalCalculators";

// NOTE: Using the standard @google/generative-ai package
const ai = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

// Definición del Schema para respuesta estructurada (JSON Mode)
const riskAnalysisSchema: any = {
  type: SchemaType.OBJECT,
  properties: {
    executiveSummary: { type: SchemaType.STRING, description: "Resumen clínico ejecutivo con respaldo científico." },

    // Perfil Multi-Outcome (Capa 10)
    predictions: {
      type: SchemaType.ARRAY,
      description: "Perfil de riesgo para múltiples outcomes clínicos.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          outcome: { type: SchemaType.STRING, description: "HOSPITALIZATION_30D, READMISSION_90D, DRUG_NON_ADHERENCE, ORGAN_FAILURE_PROGRESSION" },
          probability: { type: SchemaType.NUMBER, description: "0-100" },
          riskLevel: { type: SchemaType.STRING, description: "BAJO, MEDIO, ALTO, CRÍTICO" },
          rationale: { type: SchemaType.STRING, description: "Breve explicación de por qué este score." }
        },
        required: ["outcome", "probability", "riskLevel"]
      }
    },

    // Nivel 3: Respaldos de Guías Clínicas
    guidelinesCited: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING, description: "Ej: GPC SAC 2020, KDIGO 2023, AHA/ACC" }
    },

    clinicalAlerts: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          type: { type: SchemaType.STRING, description: "ANTI_LEAKAGE, SAFETY, CLINICAL" },
          severity: { type: SchemaType.STRING, description: "CRITICAL, WARNING, INFO" },
          message: { type: SchemaType.STRING }
        }
      }
    },

    medicationSafety: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          drug: { type: SchemaType.STRING },
          issue: { type: SchemaType.STRING, description: "Interacción, ajuste renal, etc." },
          recommendation: { type: SchemaType.STRING }
        }
      }
    },

    riskFactors: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          factor: { type: SchemaType.STRING },
          impact: { type: SchemaType.STRING, description: "POSITIVO, NEGATIVO" },
          description: { type: SchemaType.STRING }
        }
      }
    },

    riskProjection: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          month: { type: SchemaType.STRING },
          riskUntreated: { type: SchemaType.NUMBER },
          riskTreated: { type: SchemaType.NUMBER }
        }
      }
    },

    suggestedAction: { type: SchemaType.STRING, description: "Próximo paso clínico concreto." }
  },
  required: ["executiveSummary", "predictions", "clinicalAlerts", "riskFactors", "guidelinesCited"]
};

export const analyzePatientRisk = async (patient: Patient, isSimulation: boolean = false): Promise<any> => {
  const model = ai.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: riskAnalysisSchema,
    }
  });

  // Cálculos Deterministas (Capa 8: Respaldo Científico)
  const measurements = (patient as any).measurements || [];
  const latestCreatinine = measurements.find((m: any) => m.type === 'creatinine')?.value;
  const mdrdResult = calculateMDRD(patient, latestCreatinine);
  const cha2ds2vascResult = calculateCHA2DS2VASc(patient, patient.history);

  const prompt = `
    Actúa como un Sistema de Soporte a Decisiones Clínicas (CDSS) Híbrido Avanzado.
    ${isSimulation ? 'MODO SIMULACIÓN ACTIVADO: Analiza el impacto de los cambios propuestos en comparación con el estado basal.' : ''}

    EVIDENCIA CLÍNICA DETERMINISTA (CALCULADORES):
    - Filtrado Glomerular (MDRD): ${mdrdResult.gfr} ml/min/1.73m2 (Estadio: ${mdrdResult.stage}) - ${mdrdResult.note}
    - Score CHA2DS2-VASc: ${cha2ds2vascResult.score} (Riesgo ACV: ${cha2ds2vascResult.risk}) - Guía SAC/ESC.
    
    CONTEXTO (FEATURES):
    - Edad: ${patient.age} | Género: ${patient.gender}
    - Comorbilidades: ${patient.conditions.join(', ')}
    - Patología Principal: ${(patient as any).primary_condition || 'No especificada'}
    - Vulnerabilidad Social: Nivel ${patient.socialVulnerability || 1}/5
    - Barreras Sociales (SDOH): ${patient.socialFactors?.join(', ') || 'Ninguna identificada'}
    - Medicación Actual: ${patient.medications?.map(m => `${m.name} (${m.dose})`).join(', ') || 'Sin datos'}
    - Timeline Histórica: ${JSON.stringify(patient.history)}
    - Laboratorios/Mediciones: ${JSON.stringify(measurements)}

    TU TAREA:
    1. PERFIL DE RIESGO MULTI-OUTCOME: Genera predicciones independientes para:
       - 'HOSPITALIZATION_30D': Riesgo de ingreso agudo.
       - 'READMISSION_90D': Riesgo de re-ingreso recurrente a mediano plazo.
       - 'DRUG_NON_ADHERENCE': Basado en barreras sociales y estabilidad clínica.
       - 'ORGAN_FAILURE_PROGRESSION': Progresión de ERC o IC (basado en MDRD y tendencias de peso/creatinina).
    2. VALIDA y CRUZA los datos: Si un calculador clínico indica riesgo ALTO (ej: MDRD < 60), el score de 'ORGAN_FAILURE_PROGRESSION' y 'HOSPITALIZATION_30D' debe ser correlativamente alto.
    3. DETERMINANTES SOCIALES (SDOH): Si la vulnerabilidad social es >= 4 o hay barreras como 'sin_remedios', el score de 'DRUG_NON_ADHERENCE' y 'READMISSION_90D' debe aumentar significativamente.
    4. RESPALDO CIENTÍFICO: En el 'executiveSummary' y 'guidelinesCited', menciona siempre la guía de referencia.
    5. NO ALUCINES: Si no hay evidencia, no la inventes.
    
    ${isSimulation ? 'En el resumen, explica ESPECÍFICAMENTE cómo la intervención simulada cambia cada uno de estos outomes.' : ''}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const data = JSON.parse(response.text());

    // Inyectar los resultados deterministas en la respuesta para la UI
    return {
      ...data,
      clinicalScores: {
        mdrd: mdrdResult,
        cha2ds2vasc: cha2ds2vascResult
      }
    };
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return {
      executiveSummary: "Error analizando datos clínicos.",
      riskScore: 0,
      riskLevel: "ERROR",
      clinicalAlerts: [],
      riskFactors: [],
      guidelinesCited: []
    };
  }
};
