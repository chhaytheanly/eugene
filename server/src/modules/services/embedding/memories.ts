import { prisma } from "../../../database/prisma";

export async function searchMemoriesByEmbedding(embedding: number[], limit = 5) {

    const vectorStr = `[${embedding.join(",")}]`;
    
    const result = await prisma.$queryRaw<Array<{ id: string; content: string; similarity: number }>>`
        SELECT 
        id, content,
        1 - (embedding <-> ${vectorStr}::vector) AS similarity
        FROM "Memory"
        WHERE embedding IS NOT NULL
        ORDER BY embedding <-> ${vectorStr}::vector
        LIMIT ${limit};
    `;
    return result;
}