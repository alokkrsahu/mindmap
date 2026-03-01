import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  type OnNodesChange,
  type OnEdgesChange,
} from '@xyflow/react';
import type { AppNode, AppEdge, MindMapNodeData } from '../types/graph';

interface MindMapState {
  nodes: AppNode[];
  edges: AppEdge[];
  selectedNodeId: string | null;
  summary: string;

  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange<AppEdge>;

  setGraph: (nodes: AppNode[], edges: AppEdge[], summary: string) => void;
  mergeGraph: (newNodes: AppNode[], newEdges: AppEdge[]) => void;
  selectNode: (nodeId: string | null) => void;
  markNodeExpanded: (nodeId: string) => void;
  clearGraph: () => void;
}

export const useMindMapStore = create<MindMapState>()((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  summary: '',

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  setGraph: (nodes, edges, summary) => set({ nodes, edges, summary }),

  mergeGraph: (newNodes, newEdges) => {
    const existingNodeIds = new Set(get().nodes.map((n) => n.id));
    const existingEdgeIds = new Set(get().edges.map((e) => e.id));

    set({
      nodes: [
        ...get().nodes,
        ...newNodes.filter((n) => !existingNodeIds.has(n.id)),
      ],
      edges: [
        ...get().edges,
        ...newEdges.filter((e) => !existingEdgeIds.has(e.id)),
      ],
    });
  },

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  markNodeExpanded: (nodeId) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                isExpanded: true,
              } as MindMapNodeData,
            }
          : node,
      ),
    });
  },

  clearGraph: () => set({ nodes: [], edges: [], selectedNodeId: null, summary: '' }),
}));
