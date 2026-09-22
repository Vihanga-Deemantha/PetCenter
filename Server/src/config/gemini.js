import { GoogleGenAI } from "@google/genai";

// Lazily constructed — the AI narration layer is optional. If
// GEMINI_API_KEY isn't set, getGeminiClient() returns null and every
// caller falls back to a plain, still-accurate sentence instead of the
// feature erroring or being unusable.
let client = null;
let attempted = false;

export const getGeminiClient = () => {
  if (!attempted) {
    attempted = true;
    if (process.env.GEMINI_API_KEY) {
      client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
  }
  return client;
};
