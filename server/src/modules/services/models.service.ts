import OpenAI from "openai";
import { OPENCODE_BASE_URL } from "./providers/opencode";

export type ModelProvider = "openai" | "openrouter" | "opencode" | "gemini";

export type ModelInfo = {
  id: string;
  name: string;
  provider: ModelProvider;
  description?: string;
  contextLength?: number;
};

const OPENAI_MODELS: ModelInfo[] = [
  { id: "gpt-4o", name: "GPT-4o", provider: "openai" },
  { id: "gpt-4o-mini", name: "GPT-4o mini", provider: "openai" },
  { id: "gpt-4.1", name: "GPT-4.1", provider: "openai" },
  { id: "gpt-4.1-mini", name: "GPT-4.1 mini", provider: "openai" },
  { id: "gpt-4.1-nano", name: "GPT-4.1 nano", provider: "openai" },
  { id: "o1", name: "o1", provider: "openai" },
  { id: "o3", name: "o3", provider: "openai" },
  { id: "o3-mini", name: "o3-mini", provider: "openai" },
  { id: "o4-mini", name: "o4-mini", provider: "openai" },
];

const GEMINI_MODELS: ModelInfo[] = [
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "gemini", contextLength: 1_048_576 },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "gemini" },
];

const OPENROUTER_FALLBACK_MODELS: ModelInfo[] = [
  { id: "openai/gpt-4o", name: "GPT-4o (OpenRouter)", provider: "openrouter" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o mini (OpenRouter)", provider: "openrouter" },
  { id: "anthropic/claude-sonnet-4-5", name: "Claude Sonnet 4.5", provider: "openrouter" },
  { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", provider: "openrouter" },
  { id: "anthropic/claude-haiku-3-5", name: "Claude 3.5 Haiku", provider: "openrouter" },
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro (OpenRouter)", provider: "openrouter" },
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash (OpenRouter)", provider: "openrouter" },
  { id: "deepseek/deepseek-v4", name: "DeepSeek V4", provider: "openrouter" },
  { id: "deepseek/deepseek-v4-flash", name: "DeepSeek V4 Flash", provider: "openrouter" },
  { id: "qwen/qwen3.6-plus", name: "Qwen 3.6 Plus", provider: "openrouter" },
  { id: "mistralai/mistral-large", name: "Mistral Large", provider: "openrouter" },
];

const OPENCODE_FALLBACK_MODELS: ModelInfo[] = [
  { id: "big-pickle", name: "Big Pickle (free)", provider: "opencode" },
  { id: "gpt-5.1", name: "GPT-5.1", provider: "opencode" },
  { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5", provider: "opencode" },
];

const GEMINI_BASE_URL = process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai";

function normalizeOpenCodeId(id: string): string {
  return id;
}

async function fetchOpenCodeModels(): Promise<ModelInfo[]> {
  try {
    const res = await fetch(`${OPENCODE_BASE_URL}/models`, {
      headers: { Authorization: `Bearer ${process.env.OPENCODE_API_KEY}` },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      data?: { id?: string; name?: string; description?: string; context_length?: number }[];
    };
    const models = (json.data ?? [])
      .filter((m) => m.id)
      .map((m) => ({
        id: normalizeOpenCodeId(m.id!),
        name: m.name || normalizeOpenCodeId(m.id!),
        provider: "opencode" as const,
        description: m.description,
        contextLength: m.context_length,
      }));
    return models.length > 0 ? models : [];
  } catch (err) {
    console.error("Failed to fetch OpenCode models:", err);
    return [];
  }
}

export async function getAvailableModels(): Promise<ModelInfo[]> {
  const models: ModelInfo[] = [];

  if (process.env.OPENAI_API_KEY) {
    models.push(...OPENAI_MODELS);
  }

  if (process.env.GEMINI_API_KEY) {
    models.push(...GEMINI_MODELS);
  }

  if (process.env.OPENROUTER_API_KEY) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
      });
      if (res.ok) {
        const json = (await res.json()) as {
          data?: { id: string; name?: string; description?: string; context_length?: number }[];
        };
        const fetched = (json.data ?? []).map((m) => ({
          id: m.id,
          name: m.name || m.id,
          provider: "openrouter" as const,
          description: m.description,
          contextLength: m.context_length,
        }));
        models.push(...(fetched.length > 0 ? fetched : OPENROUTER_FALLBACK_MODELS));
      } else {
        models.push(...OPENROUTER_FALLBACK_MODELS);
      }
    } catch (err) {
      console.error("Failed to fetch OpenRouter models:", err);
      models.push(...OPENROUTER_FALLBACK_MODELS);
    }
  }

  if (process.env.OPENCODE_API_KEY) {
    const fetched = await fetchOpenCodeModels();
    models.push(...(fetched.length > 0 ? fetched : OPENCODE_FALLBACK_MODELS));
  }

  return models;
}

export function buildClient(provider?: ModelProvider): OpenAI {
  if (provider === "openrouter" && process.env.OPENROUTER_API_KEY) {
    return new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    });
  }
  if (provider === "opencode" && process.env.OPENCODE_API_KEY) {
    return new OpenAI({
      apiKey: process.env.OPENCODE_API_KEY,
      baseURL: OPENCODE_BASE_URL,
    });
  }
  if (provider === "gemini" && process.env.GEMINI_API_KEY) {
    return new OpenAI({
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: GEMINI_BASE_URL.replace(/\/+$/, ""),
    });
  }
  if (provider === "openai" && process.env.OPENAI_API_KEY) {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  if (process.env.OPENAI_API_KEY) {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  if (process.env.OPENROUTER_API_KEY) {
    return new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    });
  }
  if (process.env.GEMINI_API_KEY) {
    return new OpenAI({
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: GEMINI_BASE_URL.replace(/\/+$/, ""),
    });
  }
  if (process.env.OPENCODE_API_KEY) {
    return new OpenAI({
      apiKey: process.env.OPENCODE_API_KEY,
      baseURL: OPENCODE_BASE_URL,
    });
  }
  throw new Error("No LLM provider configured. Set OPENAI_API_KEY, OPENROUTER_API_KEY, GEMINI_API_KEY, or OPENCODE_API_KEY.");
}

export function defaultProvider(): ModelProvider {
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.OPENROUTER_API_KEY) return "openrouter";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.OPENCODE_API_KEY) return "opencode";
  return "openai";
}

export function defaultModel(provider: ModelProvider): string {
  if (provider === "openai") return process.env.OPENAI_MODEL || "gpt-4o";
  if (provider === "openrouter") return process.env.OPENROUTER_MODEL || "openai/gpt-4o";
  if (provider === "gemini") return process.env.GEMINI_MODEL || "gemini-2.5-pro";
  return process.env.OPENCODE_MODEL?.replace(/^opencode\//, "") || "big-pickle";
}
