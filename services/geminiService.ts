import { GoogleGenAI } from "@google/genai";

// Ensure API key is available
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateDockerfile = async (description: string): Promise<string> => {
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please check your environment variables.");
  }

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      You are a DevOps expert. Write a production-ready Multi-stage Dockerfile based on this description:
      "${description}"
      
      Requirements:
      - Use alpine or slim images where possible for size.
      - Follow best practices (layer caching, non-root user).
      - Return ONLY the Dockerfile content. No markdown code fences, no explanation.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text ? response.text.trim() : '';
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate Dockerfile. Please try again.");
  }
};
