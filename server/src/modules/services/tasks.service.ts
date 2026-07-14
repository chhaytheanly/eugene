import { prisma } from "../../database/prisma";

export async function createTask(data: {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: number;
}) {
  return prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      priority: data.priority ?? 0,
    },
  });
}

export async function getTask(id: string) {
  return prisma.task.findUnique({ where: { id } });
}

export async function listTasks(filters?: {
  completed?: boolean;
  priority?: number;
}) {
  return prisma.task.findMany({
    where: {
      ...(filters?.completed !== undefined ? { completed: filters.completed } : {}),
      ...(filters?.priority !== undefined ? { priority: filters.priority } : {}),
    },
    orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
  });
}

export async function updateTask(
  id: string,
  data: {
    title?: string;
    description?: string;
    dueDate?: string | null;
    completed?: boolean;
    priority?: number;
  }
) {
  return prisma.task.update({
    where: { id },
    data: {
      ...data,
      dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined,
    },
  });
}

export async function deleteTask(id: string) {
  return prisma.task.delete({ where: { id } });
}
