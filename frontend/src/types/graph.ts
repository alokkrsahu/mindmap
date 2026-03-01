import type { Node, Edge } from '@xyflow/react';

export type MindMapNodeData = {
  label: string;
  description: string;
  color: string;
  textColor: string;
  nodeType: 'root' | 'branch' | 'leaf';
  isExpandable: boolean;
  isExpanded: boolean;
};

export type MindMapEdgeData = {
  relationshipLabel?: string;
  edgeStyle?: 'solid' | 'dashed' | 'dotted';
};

export type AppNode = Node<MindMapNodeData, 'mindMapNode'>;
export type AppEdge = Edge<MindMapEdgeData>;
