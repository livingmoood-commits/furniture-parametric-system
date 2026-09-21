import type { BedSpec, NightstandSpec } from '../models';
import type { BedDerivedGeometry } from './rules/bedRules';
import { deriveNightstandGeometry, type DrawerGeometry } from './rules/nightstandRules';

export interface Box3D {
  x: number;
  y: number;
  z: number;
  length: number; // X extent
  width: number; // Y extent
  height: number; // Z extent
}

function lerpBox(assembled: Box3D, dx: number, dy: number, dz: number, t: number): Box3D {
  return { ...assembled, x: assembled.x + dx * t, y: assembled.y + dy * t, z: assembled.z + dz * t };
}

/**
 * Real assembled bed geometry (X = width, Y = length/depth, Z = height), then each part
 * pulled apart along the direction it would naturally move to reveal the piece behind it —
 * sides out sideways, head/foot out lengthwise, platform straight up, backrest further
 * back. `t` is 0 (fully assembled, the real shape) to 1 (fully separated). The backrest
 * starts its own z-range at the top of the base (not z=0) so it never shares vertical
 * space with the base parts even before exploding — real headboards sit on the base, they
 * don't occupy the same slab of air.
 */
export function bedExplodedBoxes(idPrefix: string, bed: BedSpec, geo: BedDerivedGeometry, t: number): Record<string, Box3D> {
  const boxes: Record<string, Box3D> = {};
  const id = (suffix: string) => `${idPrefix}-${suffix}`;

  const explodeX = geo.outerWidth * 0.3 + 90;
  const explodeY = geo.outerLength * 0.18 + 90;
  const explodeZ = bed.baseHeightMm * 0.9 + 90;

  const sideL: Box3D = { x: 0, y: 0, z: 0, length: bed.sideThicknessMm, width: geo.outerLength, height: bed.baseHeightMm };
  boxes[id('SIDE-L-01')] = lerpBox(sideL, -explodeX, 0, 0, t);

  const sideR: Box3D = { x: geo.outerWidth - bed.sideThicknessMm, y: 0, z: 0, length: bed.sideThicknessMm, width: geo.outerLength, height: bed.baseHeightMm };
  boxes[id('SIDE-R-01')] = lerpBox(sideR, explodeX, 0, 0, t);

  const headBase: Box3D = { x: 0, y: 0, z: 0, length: geo.outerWidth, width: bed.sideThicknessMm, height: bed.baseHeightMm };
  boxes[id('HEAD-BASE-01')] = lerpBox(headBase, 0, -explodeY, 0, t);

  const footBase: Box3D = { x: 0, y: geo.outerLength - bed.sideThicknessMm, z: 0, length: geo.outerWidth, width: bed.sideThicknessMm, height: bed.baseHeightMm };
  boxes[id('FOOT-BASE-01')] = lerpBox(footBase, 0, explodeY, 0, t);

  const platformZ = Math.max(0, bed.baseHeightMm - bed.frameThicknessMm);
  if (geo.liftPlatform.count === 1) {
    const platform: Box3D = { x: bed.frameThicknessMm, y: bed.frameThicknessMm, z: platformZ, length: geo.liftPlatform.widthEach, width: geo.liftPlatform.length, height: bed.frameThicknessMm };
    boxes[id('LIFT-PLATFORM-01')] = lerpBox(platform, 0, 0, explodeZ, t);
  } else {
    const half1: Box3D = { x: bed.frameThicknessMm, y: bed.frameThicknessMm, z: platformZ, length: geo.liftPlatform.widthEach, width: geo.liftPlatform.length, height: bed.frameThicknessMm };
    const half2: Box3D = { ...half1, x: half1.x + geo.liftPlatform.widthEach };
    boxes[id('LIFT-PLATFORM-01')] = lerpBox(half1, -explodeX * 0.15, 0, explodeZ, t);
    boxes[id('LIFT-PLATFORM-02')] = lerpBox(half2, explodeX * 0.15, 0, explodeZ, t);
  }

  const backrest: Box3D = { x: bed.frameThicknessMm, y: 0, z: bed.baseHeightMm, length: geo.backPanel.width, width: bed.frameThicknessMm, height: geo.backPanel.height };
  boxes[id('BACKREST-01')] = lerpBox(backrest, 0, -explodeY * 1.3, explodeZ * 0.3, t);

  return boxes;
}

/**
 * Just the carcass shell (sides, top, bottom, back) — no drawers. Kept as its own small,
 * legible scene rather than crowding it with every drawer's internals at once.
 */
export function nightstandCarcassBoxes(idPrefix: string, ns: NightstandSpec, t: number): Record<string, Box3D> {
  const geo = deriveNightstandGeometry(ns);
  const boxes: Record<string, Box3D> = {};
  const id = (suffix: string) => `${idPrefix}-${suffix}`;

  const explodeX = ns.width * 0.35 + 60;
  const explodeZ = ns.height * 0.3 + 60;
  const explodeY = ns.depth * 0.35 + 60;

  const sideL: Box3D = { x: 0, y: 0, z: 0, length: ns.sideThicknessMm, width: ns.depth, height: ns.height };
  boxes[id('SIDE-L-01')] = lerpBox(sideL, -explodeX, 0, 0, t);

  const sideR: Box3D = { x: ns.width - ns.sideThicknessMm, y: 0, z: 0, length: ns.sideThicknessMm, width: ns.depth, height: ns.height };
  boxes[id('SIDE-R-01')] = lerpBox(sideR, explodeX, 0, 0, t);

  const top: Box3D = { x: 0, y: 0, z: ns.height - ns.sideThicknessMm, length: ns.width, width: ns.depth, height: ns.sideThicknessMm };
  boxes[id('TOP-01')] = lerpBox(top, 0, 0, explodeZ, t);

  const bottom: Box3D = { x: 0, y: 0, z: 0, length: ns.width, width: ns.depth, height: ns.sideThicknessMm };
  boxes[id('BOTTOM-01')] = lerpBox(bottom, 0, 0, -explodeZ, t);

  const backThickness = Math.max(4, ns.sideThicknessMm - 6);
  const back: Box3D = { x: ns.sideThicknessMm, y: ns.depth - backThickness, z: ns.sideThicknessMm, length: geo.carcassInnerWidth, width: backThickness, height: ns.height - 2 * ns.sideThicknessMm };
  boxes[id('BACK-01')] = lerpBox(back, 0, explodeY, 0, t);

  return boxes;
}

/**
 * One drawer's own parts (front + box sides/back/bottom), laid out in a small local scene
 * of its own — not mixed in with the carcass or other drawers, so the box construction is
 * actually readable instead of lost in a crowded whole-nightstand diagram.
 */
export function nightstandDrawerBoxes(idPrefix: string, drawerIndex: number, ns: NightstandSpec, drawer: DrawerGeometry, t: number): Record<string, Box3D> {
  const boxes: Record<string, Box3D> = {};
  const dIdx = String(drawerIndex + 1).padStart(2, '0');
  const id = (suffix: string) => `${idPrefix}-DRAWER-${dIdx}-${suffix}`;

  const explodeSide = drawer.boxWidth * 0.25 + 40;
  const explodeFrontOut = drawer.boxDepth * 0.9 + 60;
  const explodeBack = drawer.boxDepth * 0.35 + 40;
  const explodeBottom = drawer.boxHeight * 0.6 + 30;

  // Local origin: the box's own bottom-front-left corner sits at (0,0,0).
  const boxBottom: Box3D = { x: 0, y: 0, z: 0, length: drawer.boxWidth, width: drawer.boxDepth, height: Math.max(4, ns.sideThicknessMm - 12) };
  boxes[id('BOX-BOTTOM')] = lerpBox(boxBottom, 0, 0, -explodeBottom, t);

  const boxSideL: Box3D = { x: 0, y: 0, z: 0, length: ns.sideThicknessMm, width: drawer.boxDepth, height: drawer.boxHeight };
  boxes[id('BOX-SIDE-L')] = lerpBox(boxSideL, -explodeSide, 0, 0, t);

  const boxSideR: Box3D = { x: drawer.boxWidth - ns.sideThicknessMm, y: 0, z: 0, length: ns.sideThicknessMm, width: drawer.boxDepth, height: drawer.boxHeight };
  boxes[id('BOX-SIDE-R')] = lerpBox(boxSideR, explodeSide, 0, 0, t);

  const boxBack: Box3D = { x: 0, y: drawer.boxDepth - ns.sideThicknessMm, z: 0, length: drawer.boxWidth, width: ns.sideThicknessMm, height: drawer.boxHeight };
  boxes[id('BOX-BACK')] = lerpBox(boxBack, 0, explodeBack, 0, t);

  const front: Box3D = { x: -10, y: -ns.sideThicknessMm, z: 0, length: drawer.boxWidth + 20, width: ns.sideThicknessMm, height: drawer.frontHeight };
  boxes[id('FRONT')] = lerpBox(front, 0, -explodeFrontOut, 0, t);

  return boxes;
}
