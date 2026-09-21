import type { Project } from '../models';

/**
 * Reasonable Phase-1 defaults, deliberately not identical to any test fixture:
 * 5mm kerf, standard 1220x2440mm board, mm/cm toggle, Egyptian-Arabic UI text
 * with a fixed LTR layout direction (explicit project-owner preference).
 */
export function createDefaultProject(): Project {
  return {
    id: 'proj-default',
    name: 'مشروع تجريبي',
    furniture: [
      {
        id: 'BED-1',
        kind: 'bed',
        name: 'السرير',
        spec: {
          mattress: { width: 1600, length: 2000, thicknessMm: 250 },
          sideThicknessMm: 18,
          frameThicknessMm: 18,
          baseHeightMm: 350,
          backHeightMm: 900,
          mechanismClearanceMm: 22,
          backMaterial: 'wood',
          materialId: 'MAT-MEL-18',
          mattressBaseType: 'solid',
          slatWidthMm: 100,
          slatGapMm: 40,
          slatThicknessMm: 15,
        },
      },
      {
        id: 'NS-1',
        kind: 'nightstand',
        name: 'الكومودينو',
        spec: {
          quantity: 2,
          width: 450,
          depth: 400,
          height: 500,
          sideThicknessMm: 18,
          drawerCount: 2,
          drawerFrontGapMm: 3,
          slideRunnerClearanceMm: 13,
          materialId: 'MAT-MEL-18',
          thinMaterialId: 'MAT-MDF-6',
        },
      },
    ],
    materials: [
      { id: 'MAT-MEL-18', name: 'Melamine 18mm', nameAr: 'أبلاكاش مطلي مليلامين 18مم', thicknessMm: 18, type: 'melamine' },
      { id: 'MAT-MDF-6', name: 'MDF 6mm (backs/bottoms)', nameAr: 'MDF سمك 6مم (ظهور وقواعد)', thicknessMm: 6, type: 'mdf' },
    ],
    boards: [
      { id: 'BOARD-MEL-18', materialId: 'MAT-MEL-18', length: 2440, width: 1220, thicknessMm: 18, qtyAvailable: 10 },
      { id: 'BOARD-MDF-6', materialId: 'MAT-MDF-6', length: 2440, width: 1220, thicknessMm: 6, qtyAvailable: 5 },
    ],
    nesting: { kerfMm: 5, edgeMarginMm: 10 },
    displayUnit: 'mm',
    lang: 'ar-eg',
  };
}
