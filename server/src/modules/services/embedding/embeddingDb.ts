import { prisma } from "../../../database/prisma";

type EmbeddableModel = "Note" | "Memory";

export async function setEmbedding(
  model: EmbeddableModel,
  id: string,
  embedding: number[]
) {
  const vector = `[${embedding.join(",")}]`;
  await prisma.$executeRawUnsafe(
    `UPDATE "${model}" SET embedding = $1::vector WHERE id = $2`,
    vector,
    id
  );
}
