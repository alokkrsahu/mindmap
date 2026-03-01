import { memo, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'motion/react';
import type { AppNode } from '../../types/graph';
import { adjustBrightness } from '../../utils/colorUtils';
import { useSessionStore } from '../../store';
import { useMindMapStore, useChatStore } from '../../store';
import { messageApi } from '../../services/messageApi';
import { apiNodesToFlowNodes, apiEdgesToFlowEdges } from '../../utils/mergeGraph';
import { v4 as uuidv4 } from 'uuid';

const nodeTypeStyles = {
  root: 'min-w-[180px] text-base font-bold shadow-xl border-2',
  branch: 'min-w-[140px] text-sm font-semibold shadow-md border',
  leaf: 'min-w-[120px] text-xs font-medium shadow-sm border',
} as const;

function MindMapNodeComponent({ data, id }: NodeProps<AppNode>) {
  const { label, color, textColor, nodeType, isExpanded } = data;
  const sessionId = useSessionStore((s) => s.sessionId);
  const setLoading = useSessionStore((s) => s.setLoading);
  const mergeGraph = useMindMapStore((s) => s.mergeGraph);
  const markNodeExpanded = useMindMapStore((s) => s.markNodeExpanded);
  const addMessage = useChatStore((s) => s.addMessage);

  const handleExpand = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!sessionId || isExpanded) return;

      setLoading(true, `Expanding "${label}"...`);
      try {
        const graph = await messageApi.expand(sessionId, id, label);
        markNodeExpanded(id);
        const newNodes = apiNodesToFlowNodes(graph.nodes);
        const newEdges = apiEdgesToFlowEdges(graph.edges);
        mergeGraph(newNodes, newEdges);

        addMessage({
          id: uuidv4(),
          role: 'assistant',
          content: graph.summary,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('Failed to expand node:', err);
      } finally {
        setLoading(false);
      }
    },
    [sessionId, id, label, isExpanded, setLoading, mergeGraph, markNodeExpanded, addMessage],
  );

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`rounded-xl px-4 py-3 flex items-center gap-2 cursor-pointer hover:brightness-110 transition-all ${nodeTypeStyles[nodeType]}`}
      style={{
        backgroundColor: color,
        color: textColor,
        borderColor: adjustBrightness(color, -30),
      }}
      onClick={handleExpand}
    >
      {/* Handles on all 4 sides for radial layout */}
      <Handle type="target" position={Position.Top} id="t-top" className="!bg-white/50 !w-2 !h-2" />
      <Handle type="target" position={Position.Bottom} id="t-bottom" className="!bg-white/50 !w-2 !h-2" />
      <Handle type="target" position={Position.Left} id="t-left" className="!bg-white/50 !w-2 !h-2" />
      <Handle type="target" position={Position.Right} id="t-right" className="!bg-white/50 !w-2 !h-2" />
      <Handle type="source" position={Position.Top} id="s-top" className="!bg-white/50 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} id="s-bottom" className="!bg-white/50 !w-2 !h-2" />
      <Handle type="source" position={Position.Left} id="s-left" className="!bg-white/50 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} id="s-right" className="!bg-white/50 !w-2 !h-2" />

      <span className="flex-1 text-center leading-tight">{label}</span>

      {!isExpanded && (
        <span
          className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold flex-shrink-0"
        >
          +
        </span>
      )}
    </motion.div>
  );
}

export const MindMapNode = memo(MindMapNodeComponent);
