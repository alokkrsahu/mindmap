import { useMindMapStore } from '../../store';

export function NodeDetailPanel() {
  const selectedNodeId = useMindMapStore((s) => s.selectedNodeId);
  const nodes = useMindMapStore((s) => s.nodes);

  if (!selectedNodeId) return null;

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const { label, description, color, nodeType } = node.data;

  return (
    <div className="border-t border-slate-700 p-4">
      <div className="rounded-xl bg-slate-800/60 border border-slate-700 p-3.5 space-y-2.5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-3.5 h-3.5 rounded-full flex-shrink-0 ring-2 ring-white/10"
            style={{ backgroundColor: color }}
          />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-slate-100 block truncate">
              {label}
            </span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
              {nodeType}
            </span>
          </div>
        </div>
        {description && (
          <p className="text-xs text-slate-400 leading-relaxed pl-6">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
