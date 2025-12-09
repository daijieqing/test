import { GoogleGenAI, Type } from "@google/genai";
import { IndicatorType, DataSource } from '../types';

// 注意这里改成 import.meta.env.VITE_API_KEY
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || '' });

export const generateAIIndicators = async (projectContext: string): Promise<any[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert Project Management Consultant. Generate 3-5 key performance indicators (KPIs) for a project management system based on this specific context: "${projectContext}". 
      Focus on metrics relevant to project schedule, cost, quality, risk, or resource management.
      Return the result as a strict JSON array.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Name of the indicator (e.g., Schedule Variance, Defect Density)" },
              description: { type: Type.STRING, description: "Brief description of what it measures and why it matters" },
              type: { type: Type.STRING, enum: ["Quantitative", "Qualitative"] },
              source: { type: Type.STRING, enum: ["System Auto-Collect", "Manual Entry"] }
            },
            required: ["name", "description", "type", "source"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (error) {
    console.error("Failed to generate indicators:", error);
    throw error;
  }
};