
import { GoogleGenAI } from "@google/genai";
import { HandResult } from "../types";

export const analyzeShoe = async (history: HandResult[]): Promise<string> => {
  if (history.length < 10) {
    return "Insufficient data. Need at least 10 hands to perform pattern analysis.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Format history for the AI
  const summary = history.map(h => `${h.winner.substring(0, 1)} (${h.playerScore}-${h.bankerScore})`).join(', ');

  const prompt = `
    As a professional Baccarat strategy analyst, analyze the following shoe results and provide a concise, sharp assessment.
    
    Results (P=Player, B=Banker, T=Tie): ${summary}
    
    Focus on:
    1. Overall bias (Banker vs Player lean).
    2. Cluster analysis (Are results clumping or choppily alternating?).
    3. Streak potential.
    4. Strategic advice for the D5 strategy (which bets on the same side if the previous delta was >= 5, otherwise opposite).
    
    Keep the tone professional, like a high-stakes pit boss observing the table.
    Limit the response to 3 short paragraphs.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Unable to generate analysis.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "An error occurred while analyzing the shoe.";
  }
};
