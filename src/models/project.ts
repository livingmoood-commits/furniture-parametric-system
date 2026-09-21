import type { Material } from './material';
import type { Board } from './board';
import type { EdgeBanding, GrainDirection } from './part';
import { NO_EDGE_BANDING } from './part';

export interface MattressSpec {
  width: number; // mm
  length: number; // mm
  thicknessMm: number;
}

export type BackMaterialKind = 'wood' | 'upholstered' | 'rattan';

/** 'solid' = one flat lift-platform board(s). 'slats' = a row of spaced wooden slats. */
export type MattressBaseType = 'solid' | 'slats';

export interface BedSpec {
  mattress: MattressSpec;
  /** Thickness of the boards that wrap the mattress (sides/head/foot) — also inflates mattress size to outer size. */
  sideThicknessMm: number;
  frameThicknessMm: number;
  baseHeightMm: number;
  backHeightMm: number;
  /** Clearance the hydraulic lift mechanism needs inside the base. */
  mechanismClearanceMm: number;
  backMaterial: BackMaterialKind;
  materialId: string;
  mattressBaseType: MattressBaseType;
  /** Only used when mattressBaseType === 'slats'. */
  slatWidthMm: number;
  slatGapMm: number;
  slatThicknessMm: number;
}

export interface NightstandSpec {
  quantity: number;
  width: number;
  depth: number;
  height: number;
  sideThicknessMm: number;
  drawerCount: number;
  /** Gap left around the drawer front so it doesn't bind against the carcass. */
  drawerFrontGapMm: number;
  /** Clearance each side of a drawer box for its slide runner. */
  slideRunnerClearanceMm: number;
  materialId: string;
  /** Thin stock (back panel, drawer bottoms) — a distinct, thinner material from the carcass. */
  thinMaterialId: string;
}

export interface FreePart {
  id: string;
  name: string;
  length: number;
  width: number;
  thicknessMm: number;
  quantity: number;
  materialId: string;
  grainDirection: GrainDirection;
  edgeBanding: EdgeBanding;
  notes?: string;
}

/** Every furniture kind the picker offers. Bed/nightstand carry a parametric spec; the rest are manual "free parts". */
export type FurnitureKind = 'bed' | 'nightstand' | 'wardrobe' | 'dressing-table' | 'dining-table' | 'kitchen-unit' | 'other';

export type FreeFurnitureKind = Exclude<FurnitureKind, 'bed' | 'nightstand'>;

export interface BedFurnitureItem {
  id: string;
  kind: 'bed';
  name: string;
  spec: BedSpec;
}

export interface NightstandFurnitureItem {
  id: string;
  kind: 'nightstand';
  name: string;
  spec: NightstandSpec;
}

/** "قطع حرة" mode: manual per-part dimensions for any furniture item, feeding the same pipeline. */
export interface FreeFurnitureItem {
  id: string;
  kind: FreeFurnitureKind;
  name: string;
  parts: FreePart[];
}

/** One entry in the project's furniture list — the single place every piece (however many, whatever kind) lives. */
export type FurnitureItem = BedFurnitureItem | NightstandFurnitureItem | FreeFurnitureItem;

export interface NestingSettings {
  kerfMm: number;
  edgeMarginMm: number;
}

export type DisplayUnit = 'mm' | 'cm';

export function defaultEdgeBanding(): EdgeBanding {
  return { ...NO_EDGE_BANDING };
}

export interface Project {
  id: string;
  name: string;
  furniture: FurnitureItem[];
  materials: Material[];
  boards: Board[];
  nesting: NestingSettings;
  displayUnit: DisplayUnit;
  lang: 'ar-eg';
}
