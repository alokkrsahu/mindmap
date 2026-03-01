import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ChatInput } from './ChatInput';
import { FileUploadButton } from './FileUploadButton';
import { ConversationHistory } from './ConversationHistory';
import { NodeDetailPanel } from './NodeDetailPanel';
import { useMindMapStore, useSessionStore } from '../../store';

const MIN_WIDTH = 280;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 360;

function SidebarSpinner() {
  const isLoading = useSessionStore((s) => s.isLoading);
  const message = useSessionStore((s) => s.loadingMessage);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-slate-700 p-4 flex items-center gap-3"
        >
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
          <p className="text-slate-300 text-xs">{message || 'Thinking...'}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Sidebar() {
  const navigate = useNavigate();
  const summary = useMindMapStore((s) => s.summary);
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [width]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      // Dragging left edge: moving mouse left = wider, right = narrower
      const delta = startX.current - e.clientX;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
      setWidth(newWidth);
    };

    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return (
    <div className="relative h-full flex-shrink-0 flex" style={{ width: collapsed ? 40 : width }}>
      {/* Resize handle */}
      {!collapsed && (
        <div
          onMouseDown={onMouseDown}
          className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-10 hover:bg-blue-500/40 active:bg-blue-500/60 transition-colors"
        />
      )}

      {/* Collapse/Expand toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-4 h-10 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-l flex items-center justify-center text-slate-300 text-xs transition-colors"
        title={collapsed ? 'Expand panel' : 'Collapse panel'}
      >
        {collapsed ? '\u25C0' : '\u25B6'}
      </button>

      {/* Sidebar content */}
      {!collapsed && (
        <aside className="w-full h-full bg-slate-900 border-l border-slate-700 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/')}
                className="text-slate-400 hover:text-slate-200 transition-colors text-sm"
                title="Back to Dashboard"
              >
                &larr;
              </button>
              <h1 className="text-lg font-bold text-slate-100">MindMap AI</h1>
            </div>
            {summary && (
              <p className="text-xs text-slate-400 mt-1">{summary}</p>
            )}
          </div>

          <ConversationHistory />

          <SidebarSpinner />

          <div className="p-4 border-t border-slate-700 space-y-2">
            <div className="flex gap-2">
              <FileUploadButton />
            </div>
            <ChatInput />
          </div>

          <NodeDetailPanel />
        </aside>
      )}

      {/* Collapsed state — just show a vertical label */}
      {collapsed && (
        <aside className="w-full h-full bg-slate-900 border-l border-slate-700 flex items-center justify-center">
          <span className="text-slate-400 text-xs [writing-mode:vertical-lr] rotate-180 select-none">
            MindMap AI
          </span>
        </aside>
      )}
    </div>
  );
}
