import { openAi } from "../providers/openai";
import { openrouter } from "../providers/openrouter";

export async function getEmbedding(text: string){
    const providers = [];

    if(process.env.openai_API_KEY){
        providers.push({
            client: openAi,
            model: "text-embedding-3-large"
        });
    }

    if(process.env.OPENROUTER_API_KEY){
        providers.push({
            client: openrouter,
            model: "google/gemini-embedding-001:free"
        });
    }

    if(providers.length === 0){
        throw new Error("No embedding provider is configured. Please set either OPENAI_API_KEY or OPENROUTER_API_KEY in your environment variables.");
    }

    for (const provider of providers) {
        try {
            const response = await provider.client.embeddings.create({
                model: provider.model,
                input: text,
                encoding_format: "float"
            })
        return response.data[0]?.embedding;

        } catch (error) {
            console.error(`Error occurred while fetching embedding from ${provider.model}:`, error);
        }

        if (provider === providers[providers.length - 1]) {
            throw new Error("Failed to fetch embedding from all providers.");
        }
    }
}