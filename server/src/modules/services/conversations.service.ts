import { prisma } from "../../database/prisma";

export async function createConversation(modelUsed: string) {
  return prisma.conversation.create({
    data: {
      messages: [],
      modelUsed,
    },
  });
}

export async function getConversation(id: string) {
  return prisma.conversation.findUnique({ where: { id } });
}

export async function listConversations() {
  return prisma.conversation.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function addMessage(
  id: string,
  message: { role: string; content: string }
) {
  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation) return null;

  const messages = (conversation.messages as Array<{ role: string; content: string }>) ?? [];
  messages.push(message);

  return prisma.conversation.update({
    where: { id },
    data: { messages },
  });
}

export async function deleteConversation(id: string) {
  return prisma.conversation.delete({ where: { id } });
}
