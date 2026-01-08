
import { GoogleGenAI, Type } from "@google/genai";
import { Patient } from "../types";

// NOTE: This assumes process.env.API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Definición del Schema para respuesta estructurada
const riskAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    executiveSummary: { type: Type.STRING, description: "Resumen clínico ejecutivo centrado en el evento a predecir." },
    riskScore: { type: Type.INTEGER, description: "Probabilidad (0-100) del evento target (ej: Internación < 30 días)." },
    riskLevel: { type: Type.STRING, description: "Nivel de riesgo textual (BAJO, MEDIO, ALTO, CRÍTICO)." },
    
    // Fundamentación Teórica
    argentinaGuidelines: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Guías GPC MinSalud/SAC aplicables."
    },
    scientificPapers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          source: { type: Type.STRING },
          year: { type: Type.STRING },
          relevance: { type: Type.STRING }
        }
      }
    },

    // Factores de Riesgo (SHAP visualization data)
    riskFactors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          factor: { type: Type.STRING },
          impact: { type: Type.STRING, description: "ALTO, MEDIO, BAJO" },
          description: { type: Type.STRING, description: "Explicación causal (Feature Importance)." }
        }
      }
    },

    // Datos para Gráfico de Proyección (Risk Trajectory)
    riskProjection: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          month: { type: Type.STRING, description: "Mes 1, Mes 2, etc." },
          riskUntreated: { type: Type.INTEGER, description: "Riesgo si NO se actúa." },
          riskTreated: { type: Type.INTEGER, description: "Riesgo proyectado post-intervención." }
        }
      }
    },

    suggestedAction: { type: Type.STRING, description: "Acción para mitigar el riesgo predicho." }
  },
  required: ["executiveSummary", "argentinaGuidelines", "scientificPapers", "riskFactors", "riskProjection", "suggestedAction"]
};

/**
 * Acts as the "Risk Engine & Explainability Layer".
 * Returns structured JSON for rich UI rendering.
 */
export const analyzePatientRisk = async (patient: Patient): Promise<any> => {
  const model = "gemini-3-pro-preview";
  
  const prompt = `
    Actúa como un MODELO PREDICTIVO CLÍNICO (XGBoost/LightGBM) interpretado por un Sistema Experto.
    
    OBJETIVO DE PREDICCIÓN (LABEL): **HOSPITALIZATION_30D** (Probabilidad de internación o muerte en próximos 30 días).

    REGLAS DE ORO (ANTI-DATA LEAKAGE):
    1. Solo puedes usar datos HISTÓRICOS provistos en 'history', 'medications', 'labs'.
    2. No inventes eventos futuros.
    3. Si el paciente no tiene eventos recientes (>6 meses), el riesgo aumenta drásticamente por "Pérdida de Seguimiento".

    CONTEXTO DEL PACIENTE (FEATURES):
    - ID: ${patient.id} | Edad: ${patient.age}
    - Comorbilidades: ${patient.conditions.join(', ')}
    - Eventos (Timeline): ${JSON.stringify(patient.history)}
    - Medicación Activa: ${patient.medications.map(m => m.name).join(', ')}
    - eGFR: ${patient.egfr}
    - Último contacto: ${patient.lastEncounter}

    TAREA:
    Genera un JSON explicando por qué el modelo predice el Score actual.
    
    1. **SHAP Values (riskFactors)**: Identifica qué variables empujan el score hacia arriba. Ej: "Internación hace 20 días" (Feature temporal fuerte), "Polifarmacia > 8" (Feature estructural).
    2. **Validación Local**: Cita guías argentinas (MinSalud, SAC) que justifiquen por qué esas variables son riesgosas.
    3. **Proyección**: Simula la curva de riesgo a 6 meses.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: riskAnalysisSchema,
        thinkingConfig: { thinkingBudget: 16000 }, 
      }
    });

    const jsonText = response.text || "{}";
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error analyzing patient risk:", error);
    return null;
  }
};

export const searchClinicalGuidelines = async (query: string): Promise<{ text: string; sources: any[] }> => {
  return { text: "", sources: [] };
};
