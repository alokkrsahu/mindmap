import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useSessionStore, useMindMapStore, useChatStore } from '../../store';
import { messageApi } from '../../services/messageApi';
import { apiNodesToFlowNodes, apiEdgesToFlowEdges } from '../../utils/mergeGraph';

export function ChatInput() {
  const [input, setInput] = useState('');
  const sessionId = useSessionStore((s) => s.sessionId);
  const isLoading = useSessionStore((s) => s.isLoading);
  const setLoading = useSessionStore((s) => s.setLoading);
  const setGraph = useMindMapStore((s) => s.setGraph);
  const mergeGraph = useMindMapStore((s) => s.mergeGraph);
  const hasNodes = useMindMapStore((s) => s.nodes.length > 0);
  const addMessage = useChatStore((s) => s.addMessage);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || !sessionId || isLoading) return;

      const userMessage = input.trim();
      setInput('');

      addMessage({
        id: uuidv4(),
        role: 'user',
        content: userMessage,
        timestamp: Date.now(),
      });

      setLoading(true, hasNodes ? 'Expanding mind map...' : 'Generating mind map...');

      try {
        const graph = await messageApi.send(sessionId, userMessage);
        const nodes = apiNodesToFlowNodes(graph.nodes);
        const edges = apiEdgesToFlowEdges(graph.edges);

        if (hasNodes) {
          // Graph already exists — merge new nodes/edges into existing graph
          mergeGraph(nodes, edges);
        } else {
          // First message — set the full graph
          setGraph(nodes, edges, graph.summary);
        }

        addMessage({
          id: uuidv4(),
          role: 'assistant',
          content: graph.summary,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('Failed to generate mind map:', err);
        addMessage({
          id: uuidv4(),
          role: 'assistant',
          content: 'Failed to generate mind map. Please try again.',
          timestamp: Date.now(),
        });
      } finally {
        setLoading(false);
      }
    },
    [input, sessionId, isLoading, hasNodes, setLoading, setGraph, mergeGraph, addMessage],
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, [input]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
      }
    },
    [handleSubmit],
  );

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter a topic to explore..."
        disabled={isLoading || !sessionId}
        rows={1}
        className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50 resize-none leading-snug"
      />
      <button
        type="submit"
        disabled={isLoading || !input.trim() || !sessionId}
        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Go
      </button>
    </form>
  );
}
