import { describe, expect, it } from 'vitest';
import { deriveBedGeometry } from '../rules/bedRules';
import type { BedSpec } from '../../models';

function makeBed(overrides: Partial<BedSpec> = {}): BedSpec {
  return {
    enabled: true,
    mattress: { width: 1600, length: 2000, thicknessMm: 250 },
    sideThicknessMm: 18,
    frameThicknessMm: 18,
    baseHeightMm: 350,
    backHeightMm: 900,
    mechanismClearanceMm: 22,
    backMaterial: 'wood',
    materialId: 'MAT-1',
    ...overrides,
  };
}

describe('deriveBedGeometry', () => {
  it('inflates mattress size by side thickness on both sides', () => {
    const bed = makeBed();
    const geo = deriveBedGeometry(bed, 10000);
    expect(geo.outerWidth).toBe(1600 + 2 * 18);
    expect(geo.outerLength).toBe(2000 + 2 * 18);
  });

  it('recomputes every downstream number when mattress.width changes (One Source of Truth)', () => {
    const before = deriveBedGeometry(makeBed(), 10000);
    const after = deriveBedGeometry(makeBed({ mattress: { width: 1800, length: 2000, thicknessMm: 250 } }), 10000);

    expect(after.outerWidth).not.toBe(before.outerWidth);
    expect(after.storageWidth).not.toBe(before.storageWidth);
    expect(after.liftPlatform.widthEach).not.toBe(before.liftPlatform.widthEach);
    expect(after.outerWidth).toBe(1800 + 2 * 18);
  });

  it('splits the lift platform into two equal halves when it exceeds the usable board width', () => {
    // storageWidth = 1600 + 36 - 36 = 1600mm, usable board width 1210mm forces a split
    const geo = deriveBedGeometry(makeBed(), 1210);
    expect(geo.liftPlatform.splitNeeded).toBe(true);
    expect(geo.liftPlatform.count).toBe(2);
    expect(geo.liftPlatform.widthEach * 2).toBeCloseTo(geo.storageWidth, 6);
  });

  it('does not split when the platform fits the usable board width', () => {
    const geo = deriveBedGeometry(makeBed(), 3000);
    expect(geo.liftPlatform.splitNeeded).toBe(false);
    expect(geo.liftPlatform.count).toBe(1);
  });

  it('final mattress height is base height plus mattress thickness', () => {
    const geo = deriveBedGeometry(makeBed(), 10000);
    expect(geo.finalMattressHeight).toBe(350 + 250);
  });
});
