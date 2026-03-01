import { prisma } from "../lib/prisma.js";

export async function getMessageHistory(sessionId: string) {
  return prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });
}

export async function saveMessage(
  sessionId: string,
  role: string,
  content: string,
  toolCallId?: string,
) {
  return prisma.message.create({
    data: { sessionId, role, content, toolCallId },
  });
}
