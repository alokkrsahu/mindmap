import { useMemo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useInternalNode,
  type EdgeProps,
  Position,
} from '@xyflow/react';
import type { AppEdge } from '../../types/graph';

const styleToDashArray: Record<string, string> = {
  solid: '0',
  dashed: '8 4',
  dotted: '3 3',
};

const styleToOpacity: Record<string, number> = {
  solid: 1.0,
  dashed: 0.7,
  dotted: 0.4,
};

/**
 * Given two node centers, determine the best handle positions
 * so the edge exits/enters from the closest side.
 */
function getClosestSides(
  sourceX: number, sourceY: number,
  targetX: number, targetY: number,
): { sourcePos: Position; targetPos: Position } {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;

  let sourcePos: Position;
  let targetPos: Position;

  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal dominant
    sourcePos = dx > 0 ? Position.Right : Position.Left;
    targetPos = dx > 0 ? Position.Left : Position.Right;
  } else {
    // Vertical dominant
    sourcePos = dy > 0 ? Position.Bottom : Position.Top;
    targetPos = dy > 0 ? Position.Top : Position.Bottom;
  }

  return { sourcePos, targetPos };
}

function getHandleCoord(
  node: { position: { x: number; y: number }; measured?: { width?: number; height?: number } },
  position: Position,
): { x: number; y: number } {
  const w = node.measured?.width ?? 180;
  const h = node.measured?.height ?? 60;
  const cx = node.position.x + w / 2;
  const cy = node.position.y + h / 2;

  switch (position) {
    case Position.Top: return { x: cx, y: node.position.y };
    case Position.Bottom: return { x: cx, y: node.position.y + h };
    case Position.Left: return { x: node.position.x, y: cy };
    case Position.Right: return { x: node.position.x + w, y: cy };
  }
}

export function MindMapEdge({
  id,
  source,
  target,
  data,
  style = {},
}: EdgeProps<AppEdge>) {
  const relationshipLabel = data?.relationshipLabel ?? '';
  const edgeStyle = data?.edgeStyle ?? 'solid';

  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  const pathData = useMemo(() => {
    if (!sourceNode || !targetNode) return null;

    const sCx = sourceNode.position.x + (sourceNode.measured?.width ?? 180) / 2;
    const sCy = sourceNode.position.y + (sourceNode.measured?.height ?? 60) / 2;
    const tCx = targetNode.position.x + (targetNode.measured?.width ?? 180) / 2;
    const tCy = targetNode.position.y + (targetNode.measured?.height ?? 60) / 2;

    const { sourcePos, targetPos } = getClosestSides(sCx, sCy, tCx, tCy);
    const sCoord = getHandleCoord(sourceNode, sourcePos);
    const tCoord = getHandleCoord(targetNode, targetPos);

    return getBezierPath({
      sourceX: sCoord.x,
      sourceY: sCoord.y,
      targetX: tCoord.x,
      targetY: tCoord.y,
      sourcePosition: sourcePos,
      targetPosition: targetPos,
    });
  }, [sourceNode, targetNode]);

  if (!pathData) return null;

  const [edgePath, labelX, labelY] = pathData;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          strokeDasharray: styleToDashArray[edgeStyle],
          opacity: styleToOpacity[edgeStyle],
          stroke: '#94a3b8',
          strokeWidth: edgeStyle === 'solid' ? 2.5 : 1.5,
        }}
      />
      {relationshipLabel && (
        <EdgeLabelRenderer>
          <div
            className="absolute text-[10px] text-slate-300 bg-slate-800/80 px-1.5 py-0.5 rounded pointer-events-none"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
          >
            {relationshipLabel}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
