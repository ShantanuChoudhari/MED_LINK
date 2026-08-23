
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

export const analyzeSymptoms = async (symptoms: string) => {
  if (!API_KEY) return null;
  
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      // ✅ Fixed: was "gemini-3-flash-preview" (doesn't exist). Use stable model:
      model: "gemini-2.0-flash",
      contents: `Analyze these symptoms: "${symptoms}". Suggest the most likely medical specialization needed and give brief triage advice (urgency level 1-5). Respond in JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            specialization: { type: Type.STRING, description: "Suggested medical specialty" },
            urgency: { type: Type.NUMBER, description: "Urgency level from 1 to 5" },
            advice: { type: Type.STRING, description: "Brief advice for the patient" }
          },
          required: ["specialization", "urgency", "advice"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return null;
  }
};
