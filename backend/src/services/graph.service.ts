import { prisma } from "../lib/prisma.js";
import type { MindMapGraph } from "../types/index.js";

export async function saveGraph(
  sessionId: string,
  graph: MindMapGraph,
  parentNodeId?: string,
) {
  return prisma.graph.create({
    data: {
      sessionId,
      nodes: graph.nodes as any,
      edges: graph.edges as any,
      summary: graph.summary,
      parentNodeId: parentNodeId ?? null,
    },
  });
}

export async function getLatestGraph(sessionId: string) {
  return prisma.graph.findFirst({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllGraphs(sessionId: string) {
  return prisma.graph.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });
}
