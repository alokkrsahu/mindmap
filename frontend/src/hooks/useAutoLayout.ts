import { useEffect, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useMindMapStore } from '../store';
import { getLayoutedElements } from '../utils/layoutEngine';

export function useAutoLayout() {
  const { fitView } = useReactFlow();
  const nodeCount = useMindMapStore((s) => s.nodes.length);
  const prevNodeCount = useRef(0);

  useEffect(() => {
    if (nodeCount === 0) {
      prevNodeCount.current = 0;
      return;
    }

    if (nodeCount !== prevNodeCount.current) {
      prevNodeCount.current = nodeCount;

      // Read latest state directly to avoid stale closures
      const { nodes, edges, summary, setGraph } = useMindMapStore.getState();
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(nodes, edges);
      setGraph(layoutedNodes, layoutedEdges, summary);

      setTimeout(() => fitView({ padding: 0.2, duration: 600 }), 50);
    }
  }, [nodeCount, fitView]);
}
