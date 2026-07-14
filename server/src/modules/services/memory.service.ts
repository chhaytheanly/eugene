import { prisma } from "../../database/prisma";
import { getEmbedding } from "./embedding/embedding";

export async function createMemory(content: string) {
  let embedding: number[] | undefined;
  try {
    embedding = await getEmbedding(content);
  } catch {
    console.warn("No embedding provider available, saving memory without vector");
  }

  return prisma.memory.create({
    data: {
      content,
      ...(embedding ? { embedding } : {}),
    },
  });
}

export async function listMemories() {
  return prisma.memory.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteMemory(id: string) {
  return prisma.memory.delete({ where: { id } });
}
