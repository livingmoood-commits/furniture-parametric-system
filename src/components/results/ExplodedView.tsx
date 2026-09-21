import { useMemo, useState } from 'react';
import type { Part, Project } from '../../models';
import type { DerivedProject } from '../../engine/derive';
import { bedExplodedBoxes, nightstandExplodedBoxes, type Box3D } from '../../engine/explodedLayout';

interface Props {
  project: Project;
  derived: DerivedProject;
}

const SCALE = 0.05;
const ANGLE = Math.PI / 6;
const PALETTE = ['#c9a67a', '#b98c5f', '#8f6a45', '#d9c2a0', '#6f5334', '#e3d3b6', '#a97f52', '#7d5c3a'];

function isoProject(x: number, y: number, z: number) {
  const sx = (x - y) * Math.cos(ANGLE);
  const sy = (x + y) * Math.sin(ANGLE) - z;
  return { sx: sx * SCALE, sy: sy * SCALE };
}

function corners(b: Box3D) {
  return {
    b000: isoProject(b.x, b.y, b.z),
    b100: isoProject(b.x + b.length, b.y, b.z),
    b110: isoProject(b.x + b.length, b.y + b.width, b.z),
    b010: isoProject(b.x, b.y + b.width, b.z),
    t000: isoProject(b.x, b.y, b.z + b.height),
    t100: isoProject(b.x + b.length, b.y, b.z + b.height),
    t110: isoProject(b.x + b.length, b.y + b.width, b.z + b.height),
    t010: isoProject(b.x, b.y + b.width, b.z + b.height),
  };
}

function poly(pts: Array<{ sx: number; sy: number }>) {
  return pts.map((p) => `${p.sx},${p.sy}`).join(' ');
}

function BoxIso({ box, fill }: { box: Box3D; fill: string }) {
  const c = corners(box);
  return (
    <g>
      <polygon points={poly([c.t000, c.t100, c.t110, c.t010])} fill={fill} stroke="#2b2a27" strokeWidth={0.6} />
      <polygon points={poly([c.b100, c.t100, c.t110, c.b110])} fill={fill} opacity={0.72} stroke="#2b2a27" strokeWidth={0.6} />
      <polygon points={poly([c.b010, c.t010, c.t110, c.b110])} fill={fill} opacity={0.5} stroke="#2b2a27" strokeWidth={0.6} />
    </g>
  );
}

/** Fallback for free-form items: no known geometric relationship, so just fan them vertically. */
function genericStackBoxes(parts: Part[]): Record<string, Box3D> {
  let z = 0;
  const boxes: Record<string, Box3D> = {};
  for (const p of parts) {
    const height = Math.max(p.dimensions.thicknessMm, 6);
    boxes[p.id] = { x: -p.dimensions.length / 2, y: -p.dimensions.width / 2, z, length: p.dimensions.length, width: p.dimensions.width, height };
    z += height + 40;
  }
  return boxes;
}

interface Card {
  key: string;
  title: string;
  entries: Array<{ part: Part; box: Box3D }>;
}

/**
 * Bed and nightstand render their REAL assembled shape (sides where sides go, platform on
 * top, drawers where drawers go) then pull apart along the slider — not a generic stack.
 * Free-form items have no known geometric relationship between their parts, so they still
 * fall back to a simple vertical fan.
 */
export function ExplodedView({ project, derived }: Props) {
  const [t, setT] = useState(0.85);

  const cards = useMemo<Card[]>(() => {
    const result: Card[] = [];

    for (const item of project.furniture) {
      if (item.kind === 'bed') {
        const entry = derived.bedGeometries.find((g) => g.itemId === item.id);
        if (!entry) continue;
        const boxMap = bedExplodedBoxes(item.id, item.spec, entry.geometry, t);
        const parts = derived.parts.filter((p) => p.componentId === `COMP-${item.id}`);
        const entries = parts.map((part) => ({ part, box: boxMap[part.id] })).filter((e): e is { part: Part; box: Box3D } => !!e.box);
        if (entries.length > 0) result.push({ key: item.id, title: item.name, entries });
      } else if (item.kind === 'nightstand') {
        for (let unit = 1; unit <= item.spec.quantity; unit++) {
          const unitPrefix = `${item.id}-0${unit}`;
          const componentId = `COMP-${unitPrefix}-UNIT`;
          const boxMap = nightstandExplodedBoxes(unitPrefix, item.spec, t);
          const parts = derived.parts.filter((p) => p.componentId === componentId);
          const entries = parts.map((part) => ({ part, box: boxMap[part.id] })).filter((e): e is { part: Part; box: Box3D } => !!e.box);
          if (entries.length > 0) result.push({ key: componentId, title: `${item.name} ${unit}`, entries });
        }
      } else {
        const parts = derived.parts.filter((p) => p.componentId === `COMP-FREE-${item.id}`);
        if (parts.length === 0) continue;
        const boxMap = genericStackBoxes(parts);
        result.push({ key: item.id, title: item.name, entries: parts.map((part) => ({ part, box: boxMap[part.id] })) });
      }
    }

    return result;
  }, [project.furniture, derived.parts, derived.bedGeometries, t]);

  if (cards.length === 0) {
    return <p className="empty-row">مفيش مكونات لسه لعرض منظورها المتفكك.</p>;
  }

  return (
    <div>
      <div className="explode-slider">
        <span>مجمّع</span>
        <input type="range" min={0} max={1} step={0.01} value={t} onChange={(e) => setT(Number(e.target.value))} />
        <span>متفكك بالكامل</span>
      </div>

      <div className="exploded-grid">
        {cards.map(({ key, title, entries }) => {
          const pts = entries.flatMap(({ box }) => Object.values(corners(box)));
          const minX = Math.min(...pts.map((p) => p.sx));
          const maxX = Math.max(...pts.map((p) => p.sx));
          const minY = Math.min(...pts.map((p) => p.sy));
          const maxY = Math.max(...pts.map((p) => p.sy));
          const pad = 20;
          const viewBox = `${minX - pad} ${minY - pad} ${maxX - minX + 2 * pad} ${maxY - minY + 2 * pad}`;

          return (
            <div className="exploded-card" key={key}>
              <h4>{title}</h4>
              <svg viewBox={viewBox} width="100%" height={360}>
                {entries.map(({ part, box }, i) => (
                  <BoxIso key={part.id} box={box} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </svg>
              <ul className="legend">
                {entries.map(({ part }, i) => (
                  <li key={part.id}>
                    <span className="swatch" style={{ background: PALETTE[i % PALETTE.length] }} />
                    {part.nameAr ?? part.name}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
