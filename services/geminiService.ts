
import { GoogleGenAI, Type } from "@google/genai";
import { Language } from "../types";

// Always use process.env.API_KEY directly in the instantiation.
// To follow guidelines, we instantiate GoogleGenAI inside functions.

export const getDailySpiritualInsight = async (day: number, lang: Language) => {
  const languageName = lang === 'ru' ? 'Russian' : 'Kazakh';
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Today is day ${day} of Ramadan. Provide a short spiritual insight, one Quranic verse (ayah) with its translation, and practical advice for the fasting person. Respond strictly in ${languageName} language in JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            ayah: { type: Type.STRING },
            meaning: { type: Type.STRING },
            advice: { type: Type.STRING },
            reflection: { type: Type.STRING }
          },
          required: ["title", "ayah", "meaning", "advice", "reflection"]
        }
      }
    });
    
    // Use .text property (not a method) to extract output string
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};

export const getDuaRecommendation = async (userState: string, lang: Language) => {
  const languageName = lang === 'ru' ? 'Russian' : 'Kazakh';
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `The user feels: "${userState}". Suggest a relevant short dua in Arabic with transliteration and translation in ${languageName}. Respond in JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            arabic: { type: Type.STRING },
            transliteration: { type: Type.STRING },
            translation: { type: Type.STRING },
            benefit: { type: Type.STRING }
          },
          required: ["arabic", "transliteration", "translation", "benefit"]
        }
      }
    });
    // Use .text property directly
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};
