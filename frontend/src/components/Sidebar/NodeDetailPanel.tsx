import { useMindMapStore } from '../../store';

export function NodeDetailPanel() {
  const selectedNodeId = useMindMapStore((s) => s.selectedNodeId);
  const nodes = useMindMapStore((s) => s.nodes);

  if (!selectedNodeId) return null;

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const { label, description, color, nodeType } = node.data;

  return (
    <div className="border-t border-slate-700 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-semibold text-slate-100">{label}</span>
        <span className="text-xs text-slate-400 capitalize">({nodeType})</span>
      </div>
      {description && (
        <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
      )}
    </div>
  );
}
