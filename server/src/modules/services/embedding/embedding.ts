import type { EmbeddingProvider } from "../../../shared/type";
import { gemini } from "../providers/gemini";
import { openAi } from "../providers/openai";
import { openrouter } from "../providers/openrouter";

export async function getEmbedding(text: string){
    const providers: EmbeddingProvider[] = [];

    if(process.env.openai_API_KEY){
        providers.push({
            type: "openai",
            client: openAi,
            model: "text-embedding-3-large"
        });
    }

    if(process.env.OPENROUTER_API_KEY){
        providers.push({
            type: "openai",
            client: openrouter,
            model: "google/gemini-embedding-001:free"
        });
    }

    if (process.env.GEMINI_API_KEY) {
        providers.push({
            type: "gemini",
            client: gemini,
            model: "gemini-embedding-001"
        })
    }

    if(providers.length === 0){
        throw new Error("No embedding provider is configured. Please set either OPENAI_API_KEY or OPENROUTER_API_KEY in your environment variables.");
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
            } 
            else {

                const response = await provider.client.embeddings.create({
                    model: provider.model,
                    input: text,
                });
                
                embedding = response.data[0]?.embedding;
                if (embedding) {
                    return embedding;
                }
            }
        }
        catch (error) {
            throw new Error(`Failed to fetch embedding from ${provider.type}: ${error}`);
        }

        if (provider === providers[providers.length - 1]) {
            throw new Error("Failed to fetch embedding from all providers.");
        }
    }
}