import { useMemo } from 'react';
import type { BoardInstance, DisplayUnit, Part } from '../../models';
import { mmToDisplay } from '../../engine/units';
import { FullscreenSection } from '../FullscreenSection';

interface Props {
  boards: BoardInstance[];
  materialNames: Record<string, string>;
  parts: Part[];
  displayUnit: DisplayUnit;
}

function fmt(mm: number, unit: DisplayUnit): string {
  const factor = unit === 'cm' ? 10 : 1;
  const v = Math.round(mmToDisplay(mm, unit) * factor) / factor;
  return `${v}`;
}

/**
 * Section 08 — the most important sheet: every board, its real size, and every part
 * placed exactly where the nesting engine put it. Nothing here is a hand-drawn mock-up.
 * Every label is clipped to its own rectangle so a narrow neighbouring piece can never
 * bleed its text into the piece next to it.
 */
export function BoardCuttingView({ boards, materialNames, parts, displayUnit }: Props) {
  const partById = useMemo(() => new Map(parts.map((p) => [p.id, p])), [parts]);
  const unitSuffix = displayUnit === 'cm' ? 'سم' : 'مم';

  if (boards.length === 0) {
    return <p className="empty-row">مفيش ألواح لسه — كمّل بيانات المشروع الأول.</p>;
  }

  return (
    <div className="board-grid">
      {boards.map((b) => (
        <FullscreenSection className="board-card" key={b.boardInstanceId}>
          <div className="board-card-header">
            <strong>{b.boardInstanceId}</strong> — {materialNames[b.materialId] ?? b.materialId} — {fmt(b.length, displayUnit)}×{fmt(b.width, displayUnit)}
            {unitSuffix}×{b.thicknessMm}مم
            <span className="eff">كفاءة {b.efficiencyPct.toFixed(1)}%</span>
          </div>
          <svg viewBox={`0 0 ${b.length} ${b.width}`} width="100%" height={Math.max(320, b.width * 0.34)} preserveAspectRatio="xMidYMid meet">
            <rect x={0} y={0} width={b.length} height={b.width} fill="#efe8d8" stroke="#2b2a27" strokeWidth={4} />
            {b.placements.map((p) => {
              const part = partById.get(p.partId);
              const baseLabel = part?.nameAr ?? part?.name ?? p.partId;
              const label = part && part.quantity > 1 ? `${baseLabel} #${p.instanceIndex + 1}${p.rotated ? ' ↻' : ''}` : `${baseLabel}${p.rotated ? ' ↻' : ''}`;
              // Always the part's OWN length/width (matching the cutting-list columns), never
              // the as-drawn footprint — a rotated piece would otherwise show ط/ع swapped
              // relative to what the cutting list says for the exact same part. Respects the
              // same mm/cm toggle as the rest of the app, not hardcoded mm.
              const partLength = part?.dimensions.length ?? p.length;
              const partWidth = part?.dimensions.width ?? p.width;
              const dimsLabel = `ط${fmt(partLength, displayUnit)}×ع${fmt(partWidth, displayUnit)}`;
              const clipId = `clip-${p.partId}-${p.instanceIndex}`;
              const rotateText = p.length < p.width;
              const shortSide = Math.min(p.length, p.width);
              const longSide = Math.max(p.length, p.width);
              // Below this, the name never fits alongside the dimensions — show only the
              // (short, always-useful) dimensions rather than clipping both into mush.
              const nameFits = shortSide > 90 && longSide > 220;
              const fontSize = Math.max(9, Math.min(longSide / 9, shortSide / (nameFits ? 3.2 : 1.8)));
              const cx = p.x + p.length / 2;
              const cy = p.y + p.width / 2;

              return (
                <g key={clipId}>
                  <clipPath id={clipId}>
                    <rect x={p.x} y={p.y} width={p.length} height={p.width} />
                  </clipPath>
                  <rect x={p.x} y={p.y} width={p.length} height={p.width} fill="#c9a67a" stroke="#2b2a27" strokeWidth={2} />
                  <text x={cx} y={cy} fontSize={fontSize} textAnchor="middle" clipPath={`url(#${clipId})`} transform={rotateText ? `rotate(-90 ${cx} ${cy})` : undefined}>
                    {nameFits ? (
                      <>
                        <tspan x={cx} dy="-0.5em">
                          {dimsLabel}
                        </tspan>
                        <tspan x={cx} dy="1.15em">
                          {label}
                        </tspan>
                      </>
                    ) : (
                      <tspan x={cx} dy="0.32em">
                        {dimsLabel}
                      </tspan>
                    )}
                  </text>
                </g>
              );
            })}
          </svg>
        </FullscreenSection>
      ))}
    </div>
  );
}
