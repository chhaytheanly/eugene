import OpenAI from "openai";

export const OPENCODE_BASE_URL =
  process.env.OPENCODE_BASE_URL || "https://opencode.ai/zen/v1";

let _client: OpenAI | null = null;

export function getOpenCode(): OpenAI {
  if (!_client) {
    if (!process.env.OPENCODE_API_KEY) {
      throw new Error("OPENCODE_API_KEY is not set");
    }
    _client = new OpenAI({
      apiKey: process.env.OPENCODE_API_KEY,
      baseURL: OPENCODE_BASE_URL,
    });
  }
  return _client;
}
