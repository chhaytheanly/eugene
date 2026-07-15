import { prisma } from "../../database/prisma";
import { getEmbedding } from "./embedding/embedding";
import { setEmbedding } from "./embedding/embeddingDb";

export async function createMemory(content: string) {
  let embedding: number[] | undefined;
  try {
    embedding = await getEmbedding(content);
  } catch {
    console.warn("No embedding provider available, saving memory without vector");
  }

  const memory = await prisma.memory.create({
    data: {
      content,
    },
  });

  if (embedding) {
    await setEmbedding("Memory", memory.id, embedding);
  }

  return memory;
}

export async function listMemories() {
  return prisma.memory.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteMemory(id: string) {
  return prisma.memory.delete({ where: { id } });
}
