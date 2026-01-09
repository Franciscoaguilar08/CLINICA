import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { Patient } from "../types";

// NOTE: Using the standard @google/generative-ai package
const ai = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

// Definición del Schema para respuesta estructurada (JSON Mode)
const riskAnalysisSchema: any = {
  type: SchemaType.OBJECT,
  properties: {
    executiveSummary: { type: SchemaType.STRING, description: "Resumen clínico ejecutivo centrado en el porqué del riesgo." },
    riskScore: { type: SchemaType.NUMBER, description: "Probabilidad (0-100) de internación en 30 días." },
    riskLevel: { type: SchemaType.STRING, description: "Nivel (BAJO, MEDIO, ALTO, CRÍTICO)." },

    // Nivel 2: Clinical Support Alerts
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

    // Representación de Drivers (SHAP)
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
  required: ["executiveSummary", "riskScore", "riskLevel", "clinicalAlerts", "riskFactors", "riskProjection"]
};

export const analyzePatientRisk = async (patient: Patient): Promise<any> => {
  const model = ai.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: riskAnalysisSchema,
    }
  });

  const prompt = `
    Actúa como un Sistema de Soporte a Decisiones Clínicas (CDSS) de Nivel 2.
    
    CONTEXTO (FEATURES):
    - Edad: ${patient.age} | Género: ${patient.gender}
    - Comorbilidades: ${patient.conditions.join(', ')}
    - eGFR Actual: ${patient.egfr || 'No disponible'}
    - Último Contacto: ${patient.lastEncounter}
    - Medicación: ${patient.medications?.map(m => `${m.name} (${m.dose})`).join(', ') || 'Sin datos'}
    - Timeline Histórica: ${JSON.stringify(patient.history)}

    TU TAREA (NIVEL 1 & 2):
    1. NIVEL 1 (XAI): Explica la probabilidad de internación en 30 días basándote EXCLUSIVAMENTE en los datos provistos. 
       - Si eGFR < 60, menciona riesgo renal.
       - Si hay internaciones recientes, destaca el efecto de re-ingreso.
    2. NIVEL 2 (ANTI-LEAKAGE): Si la última fecha de contacto ('lastEncounter') fue hace más de 120 días, genera una alerta CRÍTICA de "Pérdida de Seguimiento".
    3. NIVEL 2 (SEGURIDAD): Revisa si hay polifarmacia (>5 fármacos) o fármacos que requieran ajuste renal dado el eGFR.

    IMPORTANTE: No inventes diagnósticos que no estén en la lista. Si faltan datos, marca 'DATA_MISSING' en las alertas.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("AI Analysis failed:", error);
    // Fallback simple para evitar que la UI rompa
    return {
      executiveSummary: "Error analizando datos. Por favor reintente.",
      riskScore: 0,
      riskLevel: "ERROR",
      clinicalAlerts: [],
      riskFactors: [],
      riskProjection: []
    };
  }
};
