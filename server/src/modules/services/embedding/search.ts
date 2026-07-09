import { prisma } from "../../../database/prisma";
import type { NoteSearchResult } from "../../../shared/type";

export async function searchNotesByEmbedding(
  embedding: number[],
  limit = 5
) {
  const vector = `[${embedding.join(",")}]`;

  return prisma.$queryRaw<NoteSearchResult[]>`
    SELECT
      id,
      title,
      content,
      1 - (embedding <-> ${vector}::vector) AS similarity
    FROM "Note"
    WHERE embedding IS NOT NULL
    ORDER BY embedding <-> ${vector}::vector
    LIMIT ${limit}
  `;
}