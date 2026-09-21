import { useMemo } from 'react';
import type { BoardInstance, Part } from '../../models';

interface Props {
  boards: BoardInstance[];
  materialNames: Record<string, string>;
  parts: Part[];
}

/**
 * Section 08 — the most important sheet: every board, its real size, and every part
 * placed exactly where the nesting engine put it. Nothing here is a hand-drawn mock-up.
 * Every label is clipped to its own rectangle so a narrow neighbouring piece can never
 * bleed its text into the piece next to it.
 */
export function BoardCuttingView({ boards, materialNames, parts }: Props) {
  const partById = useMemo(() => new Map(parts.map((p) => [p.id, p])), [parts]);

  if (boards.length === 0) {
    return <p className="empty-row">مفيش ألواح لسه — كمّل بيانات المشروع الأول.</p>;
  }

  return (
    <div className="board-grid">
      {boards.map((b) => (
        <div className="board-card" key={b.boardInstanceId}>
          <div className="board-card-header">
            <strong>{b.boardInstanceId}</strong> — {materialNames[b.materialId] ?? b.materialId} — {b.length}×{b.width}×{b.thicknessMm}مم
            <span className="eff">كفاءة {b.efficiencyPct.toFixed(1)}%</span>
          </div>
          <svg viewBox={`0 0 ${b.length} ${b.width}`} width="100%" height={Math.max(320, b.width * 0.34)} preserveAspectRatio="xMidYMid meet">
            <rect x={0} y={0} width={b.length} height={b.width} fill="#efe8d8" stroke="#2b2a27" strokeWidth={4} />
            {b.placements.map((p) => {
              const part = partById.get(p.partId);
              const baseLabel = part?.nameAr ?? part?.name ?? p.partId;
              const label = part && part.quantity > 1 ? `${baseLabel} #${p.instanceIndex + 1}` : baseLabel;
              const clipId = `clip-${p.partId}-${p.instanceIndex}`;
              const rotateText = p.length < p.width;
              const fontSize = Math.max(9, Math.min(rotateText ? p.width : p.length, rotateText ? p.length : p.width) / 7);
              const cx = p.x + p.length / 2;
              const cy = p.y + p.width / 2;

              return (
                <g key={clipId}>
                  <clipPath id={clipId}>
                    <rect x={p.x} y={p.y} width={p.length} height={p.width} />
                  </clipPath>
                  <rect x={p.x} y={p.y} width={p.length} height={p.width} fill="#c9a67a" stroke="#2b2a27" strokeWidth={2} />
                  <text
                    x={cx}
                    y={cy}
                    fontSize={fontSize}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    clipPath={`url(#${clipId})`}
                    transform={rotateText ? `rotate(-90 ${cx} ${cy})` : undefined}
                  >
                    {label}
                    {p.rotated ? ' ↻' : ''}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      ))}
    </div>
  );
}
