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
          mergeGraph(nodes, edges);
        } else {
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

  const hasInput = input.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="relative">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything..."
        disabled={isLoading || !sessionId}
        rows={1}
        className="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 disabled:opacity-50 resize-none leading-snug transition-all"
      />
      <button
        type="submit"
        disabled={isLoading || !hasInput || !sessionId}
        className={`absolute right-2.5 bottom-2.5 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
          hasInput && !isLoading
            ? 'bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/20'
            : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </button>
    </form>
  );
}
