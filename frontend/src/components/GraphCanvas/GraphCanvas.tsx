import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ConnectionMode,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useMindMapStore } from '../../store';
import { MindMapNode } from './MindMapNode';
import { MindMapEdge } from './MindMapEdge';
import { useAutoLayout } from '../../hooks/useAutoLayout';
import type { AppNode } from '../../types/graph';

const nodeTypes = { mindMapNode: MindMapNode };
const edgeTypes = { mindMapEdge: MindMapEdge };

function GraphCanvasInner() {
  const nodes = useMindMapStore((s) => s.nodes);
  const edges = useMindMapStore((s) => s.edges);
  const onNodesChange = useMindMapStore((s) => s.onNodesChange);
  const onEdgesChange = useMindMapStore((s) => s.onEdgesChange);
  const selectNode = useMindMapStore((s) => s.selectNode);

  useAutoLayout();

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={(_, node) => selectNode(node.id)}
      onPaneClick={() => selectNode(null)}
      connectionMode={ConnectionMode.Loose}
      fitView
      colorMode="dark"
    >
      <Background color="#334155" gap={20} />
      <Controls />
      <MiniMap
        nodeColor={(node: AppNode) => node.data?.color ?? '#64748b'}
        maskColor="rgba(0,0,0,0.7)"
      />
    </ReactFlow>
  );
}

export function GraphCanvas() {
  return (
    <ReactFlowProvider>
      <GraphCanvasInner />
    </ReactFlowProvider>
  );
}
