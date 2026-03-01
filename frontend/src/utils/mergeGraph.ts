import type { ApiNode, ApiEdge } from '../types/api';
import type { AppNode, AppEdge } from '../types/graph';

export function apiNodesToFlowNodes(apiNodes: ApiNode[]): AppNode[] {
  return apiNodes.map((n) => ({
    id: n.id,
    type: 'mindMapNode' as const,
    position: { x: 0, y: 0 },
    data: {
      label: n.label,
      description: n.description ?? '',
      color: n.color,
      textColor: n.textColor,
      nodeType: n.type,
      isExpandable: n.isExpandable,
      isExpanded: false,
    },
  }));
}

export function apiEdgesToFlowEdges(apiEdges: ApiEdge[]): AppEdge[] {
  return apiEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: 'mindMapEdge' as const,
    data: {
      relationshipLabel: e.label,
      edgeStyle: e.style ?? 'solid',
    },
  }));
}
