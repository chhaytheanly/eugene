import NodeCache from "node-cache";
import type { EmbeddingProvider } from "../../../shared/type";
import { getGemini } from "../providers/gemini";
import { getOpenAI } from "../providers/openai";
import { getOpenRouter } from "../providers/openrouter";
import { getOpenCode } from "../providers/opencode";

const cache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });

export async function getEmbedding(text: string) {
  const cacheKey = `emb:${text}`;
  const cached = cache.get<number[]>(cacheKey);
  if (cached) return cached;

  const providers: EmbeddingProvider[] = [];

  if (process.env.OPENAI_API_KEY) {
    providers.push({
      type: "openai",
      client: getOpenAI(),
      model: "text-embedding-3-large",
    });
  }

  if (process.env.OPENROUTER_API_KEY) {
    providers.push({
      type: "openai",
      client: getOpenRouter(),
      model: "google/gemini-embedding-001:free",
    });
  }

  if (process.env.GEMINI_API_KEY) {
    providers.push({
      type: "gemini",
      client: getGemini(),
      model: "gemini-embedding-001",
    });
  }

  if (process.env.OPENCODE_API_KEY) {
    providers.push({
      type: "openai",
      client: getOpenCode(),
      model: "text-embedding-3-large",
    });
  }

  if (providers.length === 0) {
    throw new Error("No embedding provider configured. Set OPENAI_API_KEY, OPENROUTER_API_KEY, GEMINI_API_KEY, or OPENCODE_API_KEY.");
  }

  for (const provider of providers) {
    try {
      let embedding: number[] | undefined;

      if (provider.type === "gemini") {
        const response = await provider.client.models.embedContent({
          model: provider.model,
          contents: text,
        });
        embedding = response.embeddings?.[0]?.values;
      } else {
        const response = await provider.client.embeddings.create({
          model: provider.model,
          input: text,
        });
        embedding = response.data[0]?.embedding;
      }

      if (embedding) {
        cache.set(cacheKey, embedding);
        return embedding;
      }
    } catch (error) {
      console.warn(`Embedding provider ${provider.type} failed:`, error);
    }
  }

  throw new Error("All embedding providers failed.");
}
