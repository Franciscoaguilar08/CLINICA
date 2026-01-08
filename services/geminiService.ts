import { GoogleGenAI, Type } from "@google/genai";
import { Patient } from "../types";

// NOTE: This assumes process.env.API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Definición del Schema para respuesta estructurada
const riskAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    executiveSummary: { type: Type.STRING, description: "Resumen clínico ejecutivo del caso." },
    riskScore: { type: Type.INTEGER, description: "Puntaje de riesgo calculado (0-100)." },
    riskLevel: { type: Type.STRING, description: "Nivel de riesgo textual (BAJO, MEDIO, ALTO, CRÍTICO)." },
    
    // Fundamentación Teórica
    argentinaGuidelines: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Lista de Guías de Práctica Clínica (GPC) del Ministerio de Salud o Sociedades Argentinas (SAC/SAD/SAHA) aplicadas."
    },
    scientificPapers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          source: { type: Type.STRING, description: "Journal o Fuente (ej: NEJM, Revista Arg Cardiología)" },
          year: { type: Type.STRING },
          relevance: { type: Type.STRING, description: "Por qué aplica a este paciente." }
        }
      },
      description: "Papers científicos que respaldan la decisión."
    },

    // Factores de Riesgo (SHAP visualization data)
    riskFactors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          factor: { type: Type.STRING },
          impact: { type: Type.STRING, description: "ALTO, MEDIO, BAJO" },
          description: { type: Type.STRING }
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
          riskUntreated: { type: Type.INTEGER, description: "Riesgo estimado (0-100) si NO se interviene." },
          riskTreated: { type: Type.INTEGER, description: "Riesgo estimado (0-100) SI se interviene." }
        }
      },
      description: "Proyección a 6 meses de la evolución del riesgo."
    },

    suggestedAction: { type: Type.STRING, description: "Acción clínica prioritaria." }
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
    Actúa como un SISTEMA EXPERTO DE SOPORTE A LA DECISIÓN CLÍNICA (CDSS) especializado en medicina interna y cardiología para Argentina.
    
    TUS PRINCIPIOS (Dataset Mínimo Viable):
    1. Si falta información (consultas/recetas), asume el PEOR escenario (abandono de tratamiento).
    2. Prioriza la seguridad del paciente (interacciones farmacológicas).

    CONTEXTO DEL PACIENTE:
    - Paciente: ${patient.name}, ${patient.age} años.
    - Patologías: ${patient.conditions.join(', ')}.
    - eGFR: ${patient.egfr} (Fundamental para ajuste renal).
    - Fármacos: ${patient.medications.map(m => m.name).join(', ')}.
    - Brechas: ${patient.careGaps.join(', ') || "Sin brechas administrativas"}.
    - Última consulta: ${patient.lastEncounter}.

    TAREA:
    Genera un análisis estructurado en JSON.
    
    REGLAS DE EVIDENCIA (CRÍTICO):
    1. **argentinaGuidelines**: Debes citar ESPECÍFICAMENTE guías del Ministerio de Salud de la Nación, SAC (Sociedad Argentina de Cardiología) o SADI. Ej: "Guía de Práctica Clínica Nacional sobre Prevención de Enfermedades Cardiovasculares (MinSalud 2022)".
    2. **scientificPapers**: Busca evidencia real o consensos (ej: estudios sobre polifarmacia en ancianos, guías ESC/AHA si complementan).
    3. **riskProjection**: Genera una simulación numérica de 6 meses. Si el paciente no se trata (riskUntreated), el riesgo debe subir. Si se trata (riskTreated), debe bajar o estabilizarse.
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

/**
 * Legacy search (kept for sidebar tools if needed)
 */
export const searchClinicalGuidelines = async (query: string): Promise<{ text: string; sources: any[] }> => {
  // ... (Existing implementation if needed, otherwise can be ignored for the main analysis)
  return { text: "", sources: [] };
};