import { useMemo } from 'react';
import type { Component, Part } from '../../models';

interface Props {
  components: Component[];
  parts: Part[];
}

const SCALE = 0.06;
const EXPLODE_GAP = 40;
const ANGLE = Math.PI / 6;
const PALETTE = ['#c9a67a', '#b98c5f', '#8f6a45', '#d9c2a0', '#6f5334', '#e3d3b6', '#a97f52'];

function isoProject(x: number, y: number, z: number) {
  const sx = (x - y) * Math.cos(ANGLE);
  const sy = (x + y) * Math.sin(ANGLE) - z;
  return { sx: sx * SCALE, sy: sy * SCALE };
}

interface Box {
  x: number;
  y: number;
  z: number;
  length: number;
  width: number;
  height: number;
}

function corners(b: Box) {
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

function BoxIso({ box, fill }: { box: Box; fill: string }) {
  const c = corners(box);
  return (
    <g>
      <polygon points={poly([c.t000, c.t100, c.t110, c.t010])} fill={fill} stroke="#2b2a27" strokeWidth={0.6} />
      <polygon points={poly([c.b100, c.t100, c.t110, c.b110])} fill={fill} opacity={0.72} stroke="#2b2a27" strokeWidth={0.6} />
      <polygon points={poly([c.b010, c.t010, c.t110, c.b110])} fill={fill} opacity={0.5} stroke="#2b2a27" strokeWidth={0.6} />
    </g>
  );
}

/**
 * Simplified exploded diagram: each component's real parts (same length/width/thickness as
 * the cutting list) fanned out vertically with a gap, isometrically projected — not a full
 * physically-accurate 3D reconstruction, but every number on screen is the same derived
 * number used everywhere else.
 */
export function ExplodedView({ components, parts }: Props) {
  const cards = useMemo(() => {
    return components
      .map((c) => {
        const cParts = parts.filter((p) => p.componentId === c.id);
        if (cParts.length === 0) return null;
        let z = 0;
        const boxes = cParts.map((p) => {
          const height = Math.max(p.dimensions.thicknessMm, 6);
          const box: Box = { x: -p.dimensions.length / 2, y: -p.dimensions.width / 2, z, length: p.dimensions.length, width: p.dimensions.width, height };
          z += height + EXPLODE_GAP;
          return { box, part: p };
        });

        const pts = boxes.flatMap(({ box }) => {
          const c2 = corners(box);
          return Object.values(c2);
        });
        const minX = Math.min(...pts.map((p) => p.sx));
        const maxX = Math.max(...pts.map((p) => p.sx));
        const minY = Math.min(...pts.map((p) => p.sy));
        const maxY = Math.max(...pts.map((p) => p.sy));
        const pad = 20;
        const viewBox = `${minX - pad} ${minY - pad} ${maxX - minX + 2 * pad} ${maxY - minY + 2 * pad}`;

        return { component: c, boxes, viewBox };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [components, parts]);

  if (cards.length === 0) {
    return <p className="empty-row">مفيش مكونات لسه لعرض منظورها المتفكك.</p>;
  }

  return (
    <div className="exploded-grid">
      {cards.map(({ component, boxes, viewBox }) => (
        <div className="exploded-card" key={component.id}>
          <h4>{component.nameAr ?? component.name}</h4>
          <svg viewBox={viewBox} width="100%" height={320}>
            {boxes.map(({ box, part }, i) => (
              <BoxIso key={part.id} box={box} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </svg>
          <ul className="legend">
            {boxes.map(({ part }, i) => (
              <li key={part.id}>
                <span className="swatch" style={{ background: PALETTE[i % PALETTE.length] }} />
                {part.nameAr ?? part.name}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
