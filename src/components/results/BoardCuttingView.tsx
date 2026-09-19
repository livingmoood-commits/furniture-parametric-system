import type { BoardInstance } from '../../models';

interface Props {
  boards: BoardInstance[];
  materialNames: Record<string, string>;
}

/**
 * Section 08 — the most important sheet: every board, its real size, and every part
 * placed exactly where the nesting engine put it. Nothing here is a hand-drawn mock-up.
 */
export function BoardCuttingView({ boards, materialNames }: Props) {
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
          <svg viewBox={`0 0 ${b.length} ${b.width}`} width="100%" height={Math.max(160, b.width * 0.15)} preserveAspectRatio="xMidYMid meet">
            <rect x={0} y={0} width={b.length} height={b.width} fill="#efe8d8" stroke="#2b2a27" strokeWidth={4} />
            {b.placements.map((p) => (
              <g key={`${p.partId}-${p.instanceIndex}`}>
                <rect x={p.x} y={p.y} width={p.length} height={p.width} fill="#c9a67a" stroke="#2b2a27" strokeWidth={2} />
                <text x={p.x + p.length / 2} y={p.y + p.width / 2} fontSize={Math.max(10, Math.min(p.length, p.width) / 6)} textAnchor="middle" dominantBaseline="middle">
                  {p.partId}
                  {p.rotated ? ' ↻' : ''}
                </text>
              </g>
            ))}
          </svg>
        </div>
      ))}
    </div>
  );
}
