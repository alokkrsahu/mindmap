import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSessionStore, useMindMapStore, useChatStore } from '../store';
import { sessionApi } from '../services/sessionApi';
import { apiNodesToFlowNodes, apiEdgesToFlowEdges } from '../utils/mergeGraph';
import { getLayoutedElements } from '../utils/layoutEngine';

export function useSessionInit() {
  const { id } = useParams<{ id: string }>();
  const sessionId = useSessionStore((s) => s.sessionId);
  const setSessionId = useSessionStore((s) => s.setSessionId);
  const setGraph = useMindMapStore((s) => s.setGraph);
  const clearGraph = useMindMapStore((s) => s.clearGraph);
  const addMessage = useChatStore((s) => s.addMessage);
  const clearMessages = useChatStore((s) => s.clearMessages);

  useEffect(() => {
    if (!id) return;

    // If already loaded this session, skip
    if (sessionId === id) return;

    // Clear previous state
    clearGraph();
    clearMessages();
    setSessionId(id);

    // Load session history
    sessionApi.getHistory(id).then((res) => {
      // Restore chat messages — skip raw tool-call JSON from assistant
      for (const msg of res.messages) {
        if (msg.role === 'user') {
          addMessage({
            id: msg.id,
            role: 'user',
            content: msg.content,
            timestamp: new Date(msg.createdAt).getTime(),
          });
        }
      }

      // Use graph summaries as assistant messages instead of raw tool JSON
      for (const graph of res.graphs) {
        addMessage({
          id: graph.id,
          role: 'assistant',
          content: graph.summary,
          timestamp: new Date(graph.createdAt).getTime(),
        });
      }

      // Restore graph from the accumulated graphs
      if (res.graphs.length > 0) {
        // Merge all graph snapshots to reconstruct the full graph
        const allNodeIds = new Set<string>();
        const allEdgeIds = new Set<string>();
        const mergedApiNodes: typeof res.graphs[0]['nodes'] = [];
        const mergedApiEdges: typeof res.graphs[0]['edges'] = [];
        let lastSummary = '';

        for (const graph of res.graphs) {
          for (const node of graph.nodes) {
            if (!allNodeIds.has(node.id)) {
              allNodeIds.add(node.id);
              mergedApiNodes.push(node);
            }
          }
          for (const edge of graph.edges) {
            if (!allEdgeIds.has(edge.id)) {
              allEdgeIds.add(edge.id);
              mergedApiEdges.push(edge);
            }
          }
          lastSummary = graph.summary;
        }

        const flowNodes = apiNodesToFlowNodes(mergedApiNodes);
        const flowEdges = apiEdgesToFlowEdges(mergedApiEdges);
        const { nodes: layouted, edges: layoutedEdges } = getLayoutedElements(flowNodes, flowEdges);
        setGraph(layouted, layoutedEdges, lastSummary);
      }
    }).catch((err) => {
      console.error('Failed to load session history:', err);
    });
  }, [id, sessionId, setSessionId, setGraph, clearGraph, addMessage, clearMessages]);
}
