import type { NightstandSpec } from '../../models';

export interface DrawerGeometry {
  frontHeight: number;
  boxWidth: number;
  boxDepth: number;
  boxHeight: number;
}

export interface NightstandDerivedGeometry {
  carcassInnerWidth: number;
  carcassInnerDepth: number;
  drawers: DrawerGeometry[];
}

/** Pure function of NightstandSpec — same One-Source-of-Truth contract as bedRules. */
export function deriveNightstandGeometry(ns: NightstandSpec): NightstandDerivedGeometry {
  const carcassInnerWidth = ns.width - 2 * ns.sideThicknessMm;
  const carcassInnerDepth = ns.depth - ns.sideThicknessMm;

  const drawerCount = Math.max(1, ns.drawerCount);
  const perDrawerHeight = (ns.height - 2 * ns.sideThicknessMm) / drawerCount;

  const drawers: DrawerGeometry[] = Array.from({ length: drawerCount }, () => ({
    frontHeight: Math.max(0, perDrawerHeight - ns.drawerFrontGapMm),
    boxWidth: Math.max(0, carcassInnerWidth - 2 * ns.slideRunnerClearanceMm),
    boxDepth: Math.max(0, carcassInnerDepth - ns.slideRunnerClearanceMm),
    boxHeight: Math.max(0, perDrawerHeight - ns.drawerFrontGapMm - ns.sideThicknessMm),
  }));

  return { carcassInnerWidth, carcassInnerDepth, drawers };
}
