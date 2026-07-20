import type { GoogleGenAI } from "@google/genai/node";
import type { OpenAI } from "openai/index.js";

export interface NoteSearchResult {
    id: string;
    title: string;
    content: string;
    similarity: number;
}

export interface MemorySearchResult {
    id: string;
    content: string;
    similarity: number;
}

export type EmbeddingProvider =
    | {
        type: "openai" | "openrouter";
        client: any;
        model: string;
    }
    | {
        type: "gemini";
        client: any;
        model: string;
    };