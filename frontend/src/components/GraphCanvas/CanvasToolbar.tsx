import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useMindMapStore } from '../../store';
import { getLayoutedElements } from '../../utils/layoutEngine';

function ToolbarButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
    >
      {children}
    </button>
  );
}

export function CanvasToolbar() {
  const { fitView, zoomIn, zoomOut, setNodes } = useReactFlow();

  const handleOrganize = useCallback(() => {
    const { nodes, edges, summary, setGraph } = useMindMapStore.getState();
    if (nodes.length === 0) return;

    const { nodes: layouted, edges: layoutedEdges } = getLayoutedElements(nodes, edges);

    // Update React Flow directly so nodes visually move
    setNodes(layouted);
    // Also update store for consistency
    setGraph(layouted, layoutedEdges, summary);

    setTimeout(() => fitView({ padding: 0.2, duration: 600 }), 50);
  }, [fitView, setNodes]);

  const handleZoomIn = useCallback(() => {
    zoomIn({ duration: 200 });
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut({ duration: 200 });
  }, [zoomOut]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 400 });
  }, [fitView]);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-px bg-slate-800 border border-slate-600 rounded-lg overflow-hidden shadow-lg">
      <ToolbarButton onClick={handleOrganize} title="Auto-organize layout">
        Organize
      </ToolbarButton>
      <div className="w-px h-6 bg-slate-600" />
      <ToolbarButton onClick={handleZoomIn} title="Zoom in">
        +
      </ToolbarButton>
      <ToolbarButton onClick={handleZoomOut} title="Zoom out">
        &minus;
      </ToolbarButton>
      <div className="w-px h-6 bg-slate-600" />
      <ToolbarButton onClick={handleFitView} title="Fit to view">
        Fit
      </ToolbarButton>
    </div>
  );
}
