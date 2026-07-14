import { prisma } from "../../database/prisma";

export async function createEvent(data: {
  title: string;
  start: string;
  end: string;
  notes?: string;
  allDay?: boolean;
}) {
  return prisma.calendarEvent.create({
    data: {
      title: data.title,
      start: new Date(data.start),
      end: new Date(data.end),
      notes: data.notes,
      allDay: data.allDay ?? false,
    },
  });
}

export async function getEvent(id: string) {
  return prisma.calendarEvent.findUnique({ where: { id } });
}

export async function listEvents(from?: string, to?: string) {
  return prisma.calendarEvent.findMany({
    where: {
      ...(from ? { start: { gte: new Date(from) } } : {}),
      ...(to ? { end: { lte: new Date(to) } } : {}),
    },
    orderBy: { start: "asc" },
  });
}

export async function updateEvent(
  id: string,
  data: {
    title?: string;
    start?: string;
    end?: string;
    notes?: string | null;
    allDay?: boolean;
  }
) {
  return prisma.calendarEvent.update({
    where: { id },
    data: {
      ...data,
      ...(data.start ? { start: new Date(data.start) } : {}),
      ...(data.end ? { end: new Date(data.end) } : {}),
    },
  });
}

export async function deleteEvent(id: string) {
  return prisma.calendarEvent.delete({ where: { id } });
}
