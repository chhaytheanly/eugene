import { prisma } from "../../database/prisma";
import { getEmbedding } from "./embedding/embedding";

export async function createNote(title: string, content: string) {
  let embedding: number[] | undefined;
  try {
    embedding = await getEmbedding(`${title}\n${content}`);
  } catch {
    console.warn("No embedding provider available, saving note without vector");
  }

  return prisma.note.create({
    data: {
      title,
      content,
      ...(embedding ? { embedding } : {}),
    },
  });
}

export async function getNote(id: string) {
  return prisma.note.findUnique({ where: { id } });
}

export async function listNotes() {
  return prisma.note.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function updateNote(id: string, data: { title?: string; content?: string }) {
  let embedding: number[] | undefined;
  const text = [data.title, data.content].filter(Boolean).join("\n");
  if (text) {
    try {
      embedding = await getEmbedding(text);
    } catch {
      console.warn("No embedding provider available");
    }
  }

  return prisma.note.update({
    where: { id },
    data: {
      ...data,
      ...(embedding ? { embedding } : {}),
    },
  });
}

export async function deleteNote(id: string) {
  return prisma.note.delete({ where: { id } });
}
