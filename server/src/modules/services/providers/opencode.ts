import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getOpenCode(): OpenAI {
  if (!_client) {
    if (!process.env.OPENCODE_API_KEY) {
      throw new Error("OPENCODE_API_KEY is not set");
    }
    _client = new OpenAI({ apiKey: process.env.OPENCODE_API_KEY });
  }
  return _client;
}
