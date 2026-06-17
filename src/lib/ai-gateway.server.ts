import { createOpenAI } from "@ai-sdk/openai";

export function createAiProvider() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not configured.");
  return createOpenAI({ apiKey: key });
}
