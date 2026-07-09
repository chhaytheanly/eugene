import { OpenAI } from "openai";

export const openrouter = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
        "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER ?? "", // Fixed after finished APIs
        "X-Title": process.env.OPENROUTER_X_TITLE ?? ""
    }
});
