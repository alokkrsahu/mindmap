import type { AppNode, AppEdge } from '../types/graph';

const NODE_WIDTH_MAP = {
  root: 220,
  branch: 180,
  leaf: 160,
} as const;

const NODE_HEIGHT = 60;

// Absolute ring distances from the center for each depth
function getRingRadius(depth: number): number {
  // depth 0 = root (center), 1 = first ring, 2 = second ring, etc.
  return depth * 300;
}

// Minimum angular space (radians) per leaf descendant to prevent cramping
const MIN_ARC_PER_LEAF = 0.22;

function getNodeWidth(nodeType: string): number {
  return NODE_WIDTH_MAP[nodeType as keyof typeof NODE_WIDTH_MAP] ?? 180;
}

/**
 * Radial mind-map layout.
 *
 * Strategy:
 *  1. Count leaf descendants per subtree — bigger subtrees get wider wedges.
 *  2. Place all nodes at absolute ring distances from center (0,0).
 *     This means every depth-2 node is the same distance from center,
 *     regardless of which branch it belongs to — giving consistent spacing.
 *  3. Expand arcs when the inherited wedge is too narrow for the number of children,
 *     so deep expansions spread out instead of collapsing.
 */
export function getLayoutedElements(
  nodes: AppNode[],
  edges: AppEdge[],
): { nodes: AppNode[]; edges: AppEdge[] } {
  if (nodes.length === 0) return { nodes, edges };

  // Build adjacency
  const childrenOf = new Map<string, string[]>();
  const parentOf = new Map<string, string>();
  const nodeDepth = new Map<string, number>();

  for (const edge of edges) {
    if (!childrenOf.has(edge.source)) childrenOf.set(edge.source, []);
    childrenOf.get(edge.source)!.push(edge.target);
    parentOf.set(edge.target, edge.source);
  }

  // Find root
  const rootNode = nodes.find((n) => n.data.nodeType === 'root')
    ?? nodes.find((n) => !parentOf.has(n.id))
    ?? nodes[0];

  // Pass 1: compute depths and leaf counts via DFS
  const leafCount = new Map<string, number>();

  function computeSubtree(nodeId: string, depth: number): number {
    nodeDepth.set(nodeId, depth);
    const children = childrenOf.get(nodeId) ?? [];
    if (children.length === 0) {
      leafCount.set(nodeId, 1);
      return 1;
    }
    let total = 0;
    for (const child of children) {
      total += computeSubtree(child, depth + 1);
    }
    leafCount.set(nodeId, total);
    return total;
  }

  computeSubtree(rootNode.id, 0);

  // Pass 2: assign angular positions
  const positions = new Map<string, { x: number; y: number }>();
  positions.set(rootNode.id, { x: 0, y: 0 });

  interface LayoutItem {
    nodeId: string;
    startAngle: number;
    endAngle: number;
  }

  const queue: LayoutItem[] = [];

  // Root children: spread across full circle, weighted by subtree size
  const rootChildren = childrenOf.get(rootNode.id) ?? [];
  if (rootChildren.length > 0) {
    const totalLeaves = leafCount.get(rootNode.id) ?? 1;
    const fullArc = Math.max(2 * Math.PI, totalLeaves * MIN_ARC_PER_LEAF);

    let cursor = -Math.PI / 2; // start from top
    for (const childId of rootChildren) {
      const weight = leafCount.get(childId) ?? 1;
      const slice = (weight / totalLeaves) * fullArc;
      const midAngle = cursor + slice / 2;
      const depth = nodeDepth.get(childId) ?? 1;
      const r = getRingRadius(depth);

      positions.set(childId, {
        x: Math.cos(midAngle) * r,
        y: Math.sin(midAngle) * r,
      });

      queue.push({ nodeId: childId, startAngle: cursor, endAngle: cursor + slice });
      cursor += slice;
    }
  }

  // BFS deeper levels
  while (queue.length > 0) {
    const { nodeId, startAngle, endAngle } = queue.shift()!;
    const children = childrenOf.get(nodeId) ?? [];
    if (children.length === 0) continue;

    const totalWeight = children.reduce((sum, id) => sum + (leafCount.get(id) ?? 1), 0);
    const inheritedArc = endAngle - startAngle;

    // Widen the arc if it's too narrow for the children
    const requiredArc = totalWeight * MIN_ARC_PER_LEAF;
    const actualArc = Math.max(inheritedArc, requiredArc);
    const center = (startAngle + endAngle) / 2;
    const effectiveStart = center - actualArc / 2;

    let cursor = effectiveStart;
    for (const childId of children) {
      const weight = leafCount.get(childId) ?? 1;
      const slice = (weight / totalWeight) * actualArc;
      const midAngle = cursor + slice / 2;
      const depth = nodeDepth.get(childId) ?? 2;
      const r = getRingRadius(depth);

      positions.set(childId, {
        x: Math.cos(midAngle) * r,
        y: Math.sin(midAngle) * r,
      });

      queue.push({ nodeId: childId, startAngle: cursor, endAngle: cursor + slice });
      cursor += slice;
    }
  }

  // Apply positions
  const layoutedNodes = nodes.map((node) => {
    const pos = positions.get(node.id);
    const w = getNodeWidth(node.data.nodeType);
    if (pos) {
      return {
        ...node,
        position: { x: pos.x - w / 2, y: pos.y - NODE_HEIGHT / 2 },
      };
    }
    return { ...node, position: { x: 0, y: 0 } };
  });

  return { nodes: layoutedNodes, edges };
}
