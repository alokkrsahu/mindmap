import type { AppNode, AppEdge } from '../types/graph';

const NODE_WIDTH_MAP = {
  root: 220,
  branch: 180,
  leaf: 160,
} as const;

const NODE_HEIGHT = 60;
const NODE_PADDING = 50; // Minimum gap in pixels between adjacent nodes
const BASE_RING_DISTANCE = 280; // Base distance between rings

function getNodeWidth(nodeType: string): number {
  return NODE_WIDTH_MAP[nodeType as keyof typeof NODE_WIDTH_MAP] ?? 180;
}

/**
 * Compute the minimum angular arc a single node needs at a given radius
 * so that it doesn't overlap with its neighbor.
 */
function minArcForNodeAtRadius(nodeWidth: number, radius: number): number {
  if (radius <= 0) return 0;
  return (nodeWidth + NODE_PADDING) / radius;
}

/**
 * Radial mind-map layout with overlap prevention.
 *
 * Strategy:
 *  1. Count leaf descendants per subtree — bigger subtrees get wider wedges.
 *  2. Compute size-aware minimum arcs: each node's angular space is based on
 *     its pixel width at its ring radius, not a fixed constant.
 *  3. Dynamically expand ring radii when too many nodes at one depth would
 *     exceed the full circle, ensuring no overlaps.
 *  4. Post-layout overlap detection nudges any remaining overlapping nodes.
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
  const nodeMap = new Map<string, AppNode>();

  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

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

  // Pass 2: compute dynamic ring radii based on node count at each depth
  const nodesAtDepth = new Map<number, string[]>();
  for (const [id, depth] of nodeDepth) {
    if (!nodesAtDepth.has(depth)) nodesAtDepth.set(depth, []);
    nodesAtDepth.get(depth)!.push(id);
  }

  const ringRadius = new Map<number, number>();
  ringRadius.set(0, 0); // root at center

  for (const [depth, nodeIds] of nodesAtDepth) {
    if (depth === 0) continue;

    // Find the widest node at this depth
    let maxNodeWidth = 160;
    for (const id of nodeIds) {
      const node = nodeMap.get(id);
      if (node) {
        maxNodeWidth = Math.max(maxNodeWidth, getNodeWidth(node.data.nodeType));
      }
    }

    const baseRadius = depth * BASE_RING_DISTANCE;
    const numNodes = nodeIds.length;

    // Check if all nodes fit around the circle at the base radius
    const arcPerNode = minArcForNodeAtRadius(maxNodeWidth, baseRadius);
    const totalArcNeeded = numNodes * arcPerNode;

    if (totalArcNeeded > 2 * Math.PI) {
      // Need a larger radius so nodes fit without overlapping
      const expandedRadius = (numNodes * (maxNodeWidth + NODE_PADDING)) / (2 * Math.PI);
      ringRadius.set(depth, Math.max(baseRadius, expandedRadius));
    } else {
      ringRadius.set(depth, baseRadius);
    }
  }

  // Pass 3: assign angular positions with size-aware minimum arcs
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

    // Compute minimum arc needed based on actual node sizes at depth 1
    const depth1Radius = ringRadius.get(1) ?? BASE_RING_DISTANCE;
    let totalMinArc = 0;
    for (const childId of rootChildren) {
      const node = nodeMap.get(childId);
      const w = node ? getNodeWidth(node.data.nodeType) : 180;
      totalMinArc += minArcForNodeAtRadius(w, depth1Radius);
    }

    const fullArc = Math.max(2 * Math.PI, totalMinArc);

    let cursor = -Math.PI / 2; // start from top
    for (const childId of rootChildren) {
      const weight = leafCount.get(childId) ?? 1;
      const node = nodeMap.get(childId);
      const w = node ? getNodeWidth(node.data.nodeType) : 180;
      const minArc = minArcForNodeAtRadius(w, depth1Radius);

      // Weighted slice, but at least the minimum arc for this node
      const weightedSlice = (weight / totalLeaves) * fullArc;
      const slice = Math.max(weightedSlice, minArc);

      const midAngle = cursor + slice / 2;
      const r = depth1Radius;

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

    // Compute minimum arc needed for all children at their depth
    const childDepth = (nodeDepth.get(children[0]) ?? 2);
    const r = ringRadius.get(childDepth) ?? (childDepth * BASE_RING_DISTANCE);

    let totalMinArc = 0;
    for (const childId of children) {
      const node = nodeMap.get(childId);
      const w = node ? getNodeWidth(node.data.nodeType) : 160;
      totalMinArc += minArcForNodeAtRadius(w, r);
    }

    // Use the largest of: inherited arc, or minimum arc needed for children
    const actualArc = Math.max(inheritedArc, totalMinArc);
    const center = (startAngle + endAngle) / 2;
    const effectiveStart = center - actualArc / 2;

    let cursor = effectiveStart;
    for (const childId of children) {
      const weight = leafCount.get(childId) ?? 1;
      const node = nodeMap.get(childId);
      const w = node ? getNodeWidth(node.data.nodeType) : 160;
      const minArc = minArcForNodeAtRadius(w, r);

      const weightedSlice = (weight / totalWeight) * actualArc;
      const slice = Math.max(weightedSlice, minArc);

      const midAngle = cursor + slice / 2;

      positions.set(childId, {
        x: Math.cos(midAngle) * r,
        y: Math.sin(midAngle) * r,
      });

      queue.push({ nodeId: childId, startAngle: cursor, endAngle: cursor + slice });
      cursor += slice;
    }
  }

  // Pass 4: Apply positions and build result
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

  // Pass 5: Post-layout overlap nudging
  return { nodes: resolveOverlaps(layoutedNodes), edges };
}

/**
 * Detect and resolve overlapping nodes by nudging them apart.
 * Uses a simple iterative approach — checks all pairs and pushes apart.
 */
function resolveOverlaps(nodes: AppNode[]): AppNode[] {
  const result = nodes.map((n) => ({
    ...n,
    position: { ...n.position },
  }));

  const maxIterations = 10;

  for (let iter = 0; iter < maxIterations; iter++) {
    let hadOverlap = false;

    for (let i = 0; i < result.length; i++) {
      const a = result[i];
      const aW = getNodeWidth(a.data.nodeType);
      const aH = NODE_HEIGHT;

      for (let j = i + 1; j < result.length; j++) {
        const b = result[j];
        const bW = getNodeWidth(b.data.nodeType);
        const bH = NODE_HEIGHT;

        // Check bounding box overlap (with padding)
        const overlapX =
          (aW + bW) / 2 + NODE_PADDING / 2 -
          Math.abs(a.position.x + aW / 2 - (b.position.x + bW / 2));
        const overlapY =
          (aH + bH) / 2 + NODE_PADDING / 2 -
          Math.abs(a.position.y + aH / 2 - (b.position.y + bH / 2));

        if (overlapX > 0 && overlapY > 0) {
          hadOverlap = true;

          // Push apart along the axis with less overlap
          const dx = a.position.x + aW / 2 - (b.position.x + bW / 2);
          const dy = a.position.y + aH / 2 - (b.position.y + bH / 2);
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          // Nudge amount — push each node by half the overlap
          const nudge = Math.min(overlapX, overlapY) / 2 + 5;
          const nx = (dx / dist) * nudge;
          const ny = (dy / dist) * nudge;

          a.position.x += nx;
          a.position.y += ny;
          b.position.x -= nx;
          b.position.y -= ny;
        }
      }
    }

    if (!hadOverlap) break;
  }

  return result;
}
