import OpenAI from "openai";

export function getOpenRouterClient() {
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || "",
  });
}

export const MODELS = {
  chat: "openai/gpt-5.4",
  extraction: "openai/gpt-5.4",
  classification: "openai/gpt-5.4",
  review: "anthropic/claude-sonnet-4",
} as const;
