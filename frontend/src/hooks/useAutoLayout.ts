import { useEffect, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useMindMapStore } from '../store';
import { getLayoutedElements } from '../utils/layoutEngine';

export function useAutoLayout() {
  const { fitView } = useReactFlow();
  const nodes = useMindMapStore((s) => s.nodes);
  const edges = useMindMapStore((s) => s.edges);
  const setGraph = useMindMapStore((s) => s.setGraph);
  const summary = useMindMapStore((s) => s.summary);
  const prevNodeCount = useRef(0);

  useEffect(() => {
    if (nodes.length === 0) {
      prevNodeCount.current = 0;
      return;
    }

    if (nodes.length !== prevNodeCount.current) {
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(nodes, edges);
      setGraph(layoutedNodes, layoutedEdges, summary);
      prevNodeCount.current = nodes.length;

      setTimeout(() => fitView({ padding: 0.2, duration: 600 }), 50);
    }
  }, [nodes.length, edges, setGraph, summary, fitView]);
}
