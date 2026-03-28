import OpenAI from "openai";

export function getOpenRouterClient() {
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || "",
  });
}

export const MODELS = {
  chat: "anthropic/claude-sonnet-4",
  extraction: "anthropic/claude-sonnet-4",
  classification: "openai/gpt-4o",
  review: "anthropic/claude-sonnet-4",
} as const;
