import OpenAI from "openai";

export const opencode = new OpenAI({
    apiKey: process.env.OPENCODE_API_KEY
});