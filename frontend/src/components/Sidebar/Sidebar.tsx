import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ChatInput } from './ChatInput';
import { FileUploadButton } from './FileUploadButton';
import { ConversationHistory } from './ConversationHistory';
import { NodeDetailPanel } from './NodeDetailPanel';
import { useMindMapStore, useSessionStore } from '../../store';

const MIN_WIDTH = 300;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 380;

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
          className="mx-4 mb-2"
        >
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-blue-500/8 border border-blue-500/15">
            <div className="w-3.5 h-3.5 border-[1.5px] border-blue-400/30 border-t-blue-400 rounded-full animate-spin flex-shrink-0" />
            <p className="text-blue-300/80 text-xs">{message || 'Thinking...'}</p>
          </div>
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
      {/* Resize handle — elegant gradient edge */}
      {!collapsed && (
        <div
          onMouseDown={onMouseDown}
          className="absolute left-0 top-0 bottom-0 w-[3px] cursor-col-resize z-10 group"
        >
          <div className="w-full h-full bg-gradient-to-b from-slate-700/30 via-slate-600/20 to-slate-700/30 group-hover:from-blue-500/40 group-hover:via-blue-400/30 group-hover:to-blue-500/40 group-active:from-blue-500/60 group-active:via-blue-400/50 group-active:to-blue-500/60 transition-colors" />
        </div>
      )}

      {/* Collapse/Expand toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -left-3.5 top-1/2 -translate-y-1/2 z-20 w-3.5 h-10 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-l-md flex items-center justify-center text-slate-500 hover:text-slate-300 text-[8px] transition-all"
        title={collapsed ? 'Expand panel' : 'Collapse panel'}
      >
        {collapsed ? '\u25C0' : '\u25B6'}
      </button>

      {/* Sidebar content */}
      {!collapsed && (
        <aside className="w-full h-full bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all border border-slate-700/50 hover:border-slate-600"
                title="Back to Dashboard"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-semibold text-slate-100 tracking-tight">MindMap AI</h1>
              </div>
            </div>
            {summary && (
              <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed line-clamp-2 pl-11">{summary}</p>
            )}
          </div>

          {/* Divider */}
          <div className="mx-4 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />

          {/* Conversation */}
          <ConversationHistory />

          {/* Loading indicator */}
          <SidebarSpinner />

          {/* Divider */}
          <div className="mx-4 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />

          {/* Input area */}
          <div className="p-4 space-y-3">
            <FileUploadButton />
            <ChatInput />
          </div>

          {/* Node detail */}
          <NodeDetailPanel />
        </aside>
      )}

      {/* Collapsed state */}
      {collapsed && (
        <aside className="w-full h-full bg-slate-900 flex items-center justify-center border-l border-slate-800/50">
          <span className="text-slate-500 text-[10px] font-medium [writing-mode:vertical-lr] rotate-180 select-none tracking-widest uppercase">
            MindMap AI
          </span>
        </aside>
      )}
    </div>
  );
}
