import { getEmbedding } from "./embedding/embedding";
import { searchMemoriesByEmbedding } from "./embedding/memories";
import { searchNotesByEmbedding } from "./embedding/search";

export async function searchNote(query: string, limit = 5) {
    const embedding = await getEmbedding(query);
    
    if (!embedding) {
        throw new Error("Failed to get embedding for the query.");
    }

    return searchNotesByEmbedding(embedding, limit);
}

export async function searchMemory(query: string, limit = 5) {
    const embedding = await getEmbedding(query);

    if (!embedding) {
        throw new Error("Failed to get embedding for the query.");
    }

    return searchMemoriesByEmbedding(embedding, limit);
}