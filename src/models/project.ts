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

export interface BedSpec {
  enabled: boolean;
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
}

export interface NightstandSpec {
  enabled: boolean;
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

export type FreeFurnitureCategory =
  | 'wardrobe'
  | 'dressing-table'
  | 'dining-table'
  | 'kitchen-unit'
  | 'other';

/** "قطع حرة" mode: manual per-part dimensions for any furniture item, feeding the same pipeline. */
export interface FreeFurnitureItem {
  id: string;
  name: string;
  category: FreeFurnitureCategory;
  parts: FreePart[];
}

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
  bed: BedSpec;
  nightstand: NightstandSpec;
  freeFurniture: FreeFurnitureItem[];
  materials: Material[];
  boards: Board[];
  nesting: NestingSettings;
  displayUnit: DisplayUnit;
  lang: 'ar-eg';
}
