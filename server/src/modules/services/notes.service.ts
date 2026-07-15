import { prisma } from "../../database/prisma";
import { getEmbedding } from "./embedding/embedding";
import { setEmbedding } from "./embedding/embeddingDb";

export async function createNote(title: string, content: string) {
  let embedding: number[] | undefined;
  try {
    embedding = await getEmbedding(`${title}\n${content}`);
  } catch {
    console.warn("No embedding provider available, saving note without vector");
  }

  const note = await prisma.note.create({
    data: {
      title,
      content,
    },
  });

  if (embedding) {
    await setEmbedding("Note", note.id, embedding);
  }

  return note;
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

  const note = await prisma.note.update({
    where: { id },
    data,
  });

  if (embedding) {
    await setEmbedding("Note", id, embedding);
  }

  return note;
}

export async function deleteNote(id: string) {
  return prisma.note.delete({ where: { id } });
}
