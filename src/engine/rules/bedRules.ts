import type { BedSpec } from '../../models';

export interface LiftPlatformGeometry {
  /** 1 unless the platform is wider than the usable board width, then 2 equal halves. */
  count: 1 | 2;
  widthEach: number;
  length: number;
  splitNeeded: boolean;
}

export interface BackPanelGeometry {
  width: number;
  height: number;
}

export interface BedDerivedGeometry {
  outerWidth: number;
  outerLength: number;
  storageWidth: number;
  storageLength: number;
  storageDepth: number;
  liftPlatform: LiftPlatformGeometry;
  backPanel: BackPanelGeometry;
  finalMattressHeight: number;
}

/**
 * Every field here is a pure function of BedSpec — nothing here is ever hand-typed
 * downstream (parts, cutting list, drawings). Changing mattress.width and re-deriving
 * is the entire "parametric" contract of the project.
 */
export function deriveBedGeometry(bed: BedSpec, usableBoardWidthMm: number): BedDerivedGeometry {
  const outerWidth = bed.mattress.width + 2 * bed.sideThicknessMm;
  const outerLength = bed.mattress.length + 2 * bed.sideThicknessMm;

  const storageWidth = outerWidth - 2 * bed.frameThicknessMm;
  const storageLength = outerLength - 2 * bed.frameThicknessMm;
  const storageDepth = Math.max(0, bed.baseHeightMm - bed.mechanismClearanceMm - bed.frameThicknessMm);

  const splitNeeded = storageWidth > usableBoardWidthMm;
  const liftPlatform: LiftPlatformGeometry = splitNeeded
    ? { count: 2, widthEach: storageWidth / 2, length: storageLength, splitNeeded: true }
    : { count: 1, widthEach: storageWidth, length: storageLength, splitNeeded: false };

  const backPanel: BackPanelGeometry = {
    width: outerWidth - 2 * bed.frameThicknessMm,
    height: bed.backHeightMm,
  };

  const finalMattressHeight = bed.baseHeightMm + bed.mattress.thicknessMm;

  return { outerWidth, outerLength, storageWidth, storageLength, storageDepth, liftPlatform, backPanel, finalMattressHeight };
}
