import type { BedSpec, Component, Part } from '../../models';
import { defaultEdgeBanding } from '../../models';
import type { BedDerivedGeometry } from '../rules/bedRules';

export interface BedGenerationResult {
  parts: Part[];
  components: Component[];
}

/**
 * Turns derived bed geometry into cuttable Parts + a display Component.
 * Every dimension here is read off `geo`/`bed` — nothing is a literal number.
 * `idPrefix` is the owning furniture-list item's own id (e.g. "BED-1042"), so two
 * bed items in the same project never collide on part ids.
 */
export function generateBedParts(idPrefix: string, bed: BedSpec, geo: BedDerivedGeometry): BedGenerationResult {
  const componentId = `COMP-${idPrefix}`;
  const id = (suffix: string) => `${idPrefix}-${suffix}`;
  const parts: Part[] = [];

  const sideEdge = { ...defaultEdgeBanding(), top: true };

  const sideL: Part = {
    id: id('SIDE-L-01'),
    name: 'Bed left side rail',
    nameAr: 'جانب السرير الأيسر',
    componentId,
    dimensions: { length: geo.outerLength, width: bed.baseHeightMm, thicknessMm: bed.sideThicknessMm },
    quantity: 1,
    materialId: bed.materialId,
    grainDirection: 'length',
    rotationAllowed: false,
    edgeBanding: sideEdge,
    machiningOperations: [],
    assembly: [
      { toPartId: id('HEAD-BASE-01'), joinType: 'cam-lock', fastenerCount: 2 },
      { toPartId: id('FOOT-BASE-01'), joinType: 'cam-lock', fastenerCount: 2 },
    ],
  };
  const sideR: Part = { ...sideL, id: id('SIDE-R-01'), name: 'Bed right side rail', nameAr: 'جانب السرير الأيمن' };

  const headBase: Part = {
    id: id('HEAD-BASE-01'),
    name: 'Head end base panel',
    nameAr: 'قاعدة طرف الرأس',
    componentId,
    dimensions: { length: geo.outerWidth, width: bed.baseHeightMm, thicknessMm: bed.sideThicknessMm },
    quantity: 1,
    materialId: bed.materialId,
    grainDirection: 'length',
    rotationAllowed: false,
    edgeBanding: sideEdge,
    machiningOperations: [],
    assembly: [],
  };
  const footBase: Part = { ...headBase, id: id('FOOT-BASE-01'), name: 'Foot end base panel', nameAr: 'قاعدة طرف الرجل' };

  const liftPlatformParts: Part[] = Array.from({ length: geo.liftPlatform.count }, (_, i) => {
    const idx = i + 1;
    const partId = geo.liftPlatform.count === 1 ? id('LIFT-PLATFORM-01') : id(`LIFT-PLATFORM-0${idx}`);
    const part: Part = {
      id: partId,
      name: geo.liftPlatform.count === 1 ? 'Lift platform' : `Lift platform (half ${idx})`,
      nameAr: geo.liftPlatform.count === 1 ? 'لوح الرفع' : `لوح الرفع (نص ${idx})`,
      componentId,
      dimensions: { length: geo.liftPlatform.length, width: geo.liftPlatform.widthEach, thicknessMm: bed.frameThicknessMm },
      quantity: 1,
      materialId: bed.materialId,
      grainDirection: 'none',
      rotationAllowed: true,
      edgeBanding: defaultEdgeBanding(),
      machiningOperations: [],
      assembly: [
        { toPartId: id('SIDE-L-01'), joinType: 'hinge', fastenerCount: 2, note: 'Hydraulic lift hinge' },
        { toPartId: id('SIDE-R-01'), joinType: 'hinge', fastenerCount: 2, note: 'Hydraulic lift hinge' },
      ],
    };
    if (geo.liftPlatform.splitNeeded) {
      part.splitInfo = { originalPartId: id('LIFT-PLATFORM'), index: idx, of: geo.liftPlatform.count, axis: 'width' };
    }
    return part;
  });

  const backrest: Part = {
    id: id('BACKREST-01'),
    name: 'Headboard backrest panel',
    nameAr: 'ظهر السرير',
    componentId,
    dimensions: { length: geo.backPanel.width, width: geo.backPanel.height, thicknessMm: bed.frameThicknessMm },
    quantity: 1,
    materialId: bed.materialId,
    grainDirection: 'width',
    rotationAllowed: bed.backMaterial !== 'wood',
    edgeBanding: { ...defaultEdgeBanding(), top: true },
    machiningOperations: [],
    assembly: [{ toPartId: id('HEAD-BASE-01'), joinType: 'screw', fastenerCount: 4 }],
  };
  if (bed.backMaterial !== 'wood') {
    backrest.sourceFlag = `Back finish is "${bed.backMaterial}" — panel below is the wood substrate; upholstery/rattan is a Hardware/Accessories line, not a cut part.`;
  }

  parts.push(sideL, sideR, headBase, footBase, ...liftPlatformParts, backrest);

  const component: Component = {
    id: componentId,
    name: 'Bed',
    nameAr: 'السرير',
    partIds: parts.map((p) => p.id),
  };

  return { parts, components: [component] };
}
