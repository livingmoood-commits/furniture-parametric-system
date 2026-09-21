import type { BedSpec, NightstandSpec } from '../models';
import type { BedDerivedGeometry } from './rules/bedRules';
import { deriveNightstandGeometry } from './rules/nightstandRules';

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
 * back. `t` is 0 (fully assembled, the real shape) to 1 (fully separated).
 */
export function bedExplodedBoxes(idPrefix: string, bed: BedSpec, geo: BedDerivedGeometry, t: number): Record<string, Box3D> {
  const boxes: Record<string, Box3D> = {};
  const id = (suffix: string) => `${idPrefix}-${suffix}`;

  const explodeX = geo.outerWidth * 0.35 + 100;
  const explodeY = geo.outerLength * 0.2 + 100;
  const explodeZ = bed.baseHeightMm * 1.0 + 100;

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

  const backrest: Box3D = { x: bed.frameThicknessMm, y: 0, z: 0, length: geo.backPanel.width, width: bed.frameThicknessMm, height: geo.backPanel.height };
  boxes[id('BACKREST-01')] = lerpBox(backrest, 0, -explodeY * 1.4, 0, t);

  return boxes;
}

/**
 * Real assembled nightstand geometry for one unit: carcass sides/top/bottom/back in their
 * real box positions, drawers slid open forward (front + its own box) per drawer, each
 * drawer opening further than the one below/above it so they read as separate.
 */
export function nightstandExplodedBoxes(idPrefix: string, ns: NightstandSpec, t: number): Record<string, Box3D> {
  const geo = deriveNightstandGeometry(ns);
  const boxes: Record<string, Box3D> = {};
  const id = (suffix: string) => `${idPrefix}-${suffix}`;

  const explodeX = ns.width * 0.45 + 80;
  const explodeZ = ns.height * 0.4 + 80;
  const explodeYBase = ns.depth * 0.55 + 80;

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
  boxes[id('BACK-01')] = lerpBox(back, 0, explodeYBase * 0.5, 0, t);

  const drawerCount = Math.max(1, ns.drawerCount);
  const perDrawerHeight = (ns.height - 2 * ns.sideThicknessMm) / drawerCount;

  geo.drawers.forEach((drawer, i) => {
    const dIdx = String(i + 1).padStart(2, '0');
    const dPrefix = `DRAWER-${dIdx}-`;
    // topmost drawer is index 0
    const drawerZ = ns.sideThicknessMm + (drawerCount - 1 - i) * perDrawerHeight;
    // Negative: the front face is at y=0, so "pulled out" means moving further into negative
    // y (toward the viewer), never toward +y (which would push the drawer through the back).
    const pullOut = -explodeYBase * (1 + i * 0.5); // lower drawers pull out further so all are visible

    const front: Box3D = { x: ns.sideThicknessMm, y: 0, z: drawerZ, length: geo.carcassInnerWidth, width: ns.sideThicknessMm, height: drawer.frontHeight };
    boxes[id(`${dPrefix}FRONT`)] = lerpBox(front, 0, pullOut, 0, t);

    const boxSideL: Box3D = { x: ns.sideThicknessMm, y: ns.sideThicknessMm, z: drawerZ, length: ns.sideThicknessMm, width: drawer.boxDepth, height: drawer.boxHeight };
    boxes[id(`${dPrefix}BOX-SIDE-L`)] = lerpBox(boxSideL, 0, pullOut, 0, t);

    const boxSideR: Box3D = { ...boxSideL, x: ns.width - ns.sideThicknessMm * 2 };
    boxes[id(`${dPrefix}BOX-SIDE-R`)] = lerpBox(boxSideR, 0, pullOut, 0, t);

    const boxBack: Box3D = { x: ns.sideThicknessMm, y: ns.sideThicknessMm + drawer.boxDepth, z: drawerZ, length: drawer.boxWidth, width: ns.sideThicknessMm, height: drawer.boxHeight };
    boxes[id(`${dPrefix}BOX-BACK`)] = lerpBox(boxBack, 0, pullOut, 0, t);

    const boxBottom: Box3D = { x: ns.sideThicknessMm, y: ns.sideThicknessMm, z: drawerZ, length: drawer.boxWidth, width: drawer.boxDepth, height: Math.max(4, ns.sideThicknessMm - 12) };
    boxes[id(`${dPrefix}BOX-BOTTOM`)] = lerpBox(boxBottom, 0, pullOut, 0, t);
  });

  return boxes;
}
