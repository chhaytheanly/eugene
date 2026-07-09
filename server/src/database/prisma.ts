import { PrismaClient } from "@prisma/client/extension";

export const prisma = new PrismaClient();

export async function enableVectorExtension() {
  await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector;`;
}