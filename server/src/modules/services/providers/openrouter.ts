import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getOpenRouter(): OpenAI {
  if (!_client) {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not set");
    }
    _client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER ?? "",
        "X-Title": process.env.OPENROUTER_X_TITLE ?? "",
      },
    });
  }
  return _client;
}
