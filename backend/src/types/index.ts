export interface MindMapNode {
  id: string;
  label: string;
  description: string;
  color: string;
  textColor: string;
  type: "root" | "branch" | "leaf";
  isExpandable: boolean;
  depth: number;
}

export interface MindMapEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  style?: "solid" | "dashed" | "dotted";
}

export interface MindMapGraph {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  summary: string;
  expansionContext?: string;
}
