import { prisma } from "../lib/prisma.js";

export async function createSession() {
  return prisma.session.create({ data: {} });
}

export async function getSession(id: string) {
  return prisma.session.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      graphs: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function addFileIdToSession(sessionId: string, fileId: string) {
  return prisma.session.update({
    where: { id: sessionId },
    data: { uploadedFileIds: { push: fileId } },
  });
}

export async function deleteSession(id: string) {
  // Delete related records first (cascade)
  await prisma.message.deleteMany({ where: { sessionId: id } });
  await prisma.graph.deleteMany({ where: { sessionId: id } });
  return prisma.session.delete({ where: { id } });
}

export async function listSessions() {
  const sessions = await prisma.session.findMany({
    where: { messages: { some: {} } },
    orderBy: { createdAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      graphs: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: true, graphs: true } },
    },
  });

  return sessions.map((s) => {
    const firstUserMsg = s.messages.find((m) => m.role === "user");
    return {
      id: s.id,
      createdAt: s.createdAt,
      messageCount: s._count.messages,
      graphCount: s._count.graphs,
      firstMessage: firstUserMsg?.content ?? null,
      lastSummary: s.graphs[0]?.summary ?? null,
    };
  });
}
