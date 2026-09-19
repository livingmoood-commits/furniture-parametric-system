import type { Component, NightstandSpec, Part } from '../../models';
import { defaultEdgeBanding } from '../../models';
import { deriveNightstandGeometry } from '../rules/nightstandRules';

export interface NightstandGenerationResult {
  parts: Part[];
  components: Component[];
}

export interface ThinMaterial {
  id: string;
  thicknessMm: number;
}

/**
 * Generates one full carcass + drawer set per unit. `nightstand.quantity` copies get
 * distinct `${idPrefix}-01-...`, `${idPrefix}-02-...` id prefixes but come from the exact
 * same geometry function. `idPrefix` is the owning furniture-list item's own id, so two
 * nightstand items in the same project never collide. `thinMaterial` is a distinct,
 * thinner board (e.g. 6mm MDF) for the back panel and drawer bottoms — tagging them with
 * the main carcass material at a fake thickness would leave them with no matching board.
 */
export function generateNightstandParts(idPrefix: string, itemName: string, ns: NightstandSpec, thinMaterial: ThinMaterial): NightstandGenerationResult {
  const geo = deriveNightstandGeometry(ns);
  const parts: Part[] = [];
  const components: Component[] = [];

  for (let unit = 1; unit <= ns.quantity; unit++) {
    const prefix = `${idPrefix}-0${unit}-`;
    const componentId = `COMP-${prefix}UNIT`;
    const visibleEdge = { ...defaultEdgeBanding(), top: true };

    const sideL: Part = {
      id: `${prefix}SIDE-L-01`,
      name: `${itemName} ${unit} left side`,
      nameAr: `جانب ${itemName} ${unit} الأيسر`,
      componentId,
      dimensions: { length: ns.depth, width: ns.height, thicknessMm: ns.sideThicknessMm },
      quantity: 1,
      materialId: ns.materialId,
      grainDirection: 'length',
      rotationAllowed: false,
      edgeBanding: visibleEdge,
      machiningOperations: [],
      assembly: [
        { toPartId: `${prefix}TOP-01`, joinType: 'cam-lock', fastenerCount: 2 },
        { toPartId: `${prefix}BOTTOM-01`, joinType: 'cam-lock', fastenerCount: 2 },
      ],
    };
    const sideR: Part = { ...sideL, id: `${prefix}SIDE-R-01`, name: `${itemName} ${unit} right side`, nameAr: `جانب ${itemName} ${unit} الأيمن` };

    const top: Part = {
      id: `${prefix}TOP-01`,
      name: `${itemName} ${unit} top`,
      nameAr: `سطح ${itemName} ${unit}`,
      componentId,
      dimensions: { length: ns.width, width: ns.depth, thicknessMm: ns.sideThicknessMm },
      quantity: 1,
      materialId: ns.materialId,
      grainDirection: 'length',
      rotationAllowed: false,
      edgeBanding: { ...defaultEdgeBanding(), top: true, left: true, right: true },
      machiningOperations: [],
      assembly: [],
    };
    const bottom: Part = { ...top, id: `${prefix}BOTTOM-01`, name: `${itemName} ${unit} bottom`, nameAr: `قاعدة ${itemName} ${unit}`, edgeBanding: defaultEdgeBanding() };

    const back: Part = {
      id: `${prefix}BACK-01`,
      name: `${itemName} ${unit} back panel`,
      nameAr: `ظهر ${itemName} ${unit}`,
      componentId,
      dimensions: { length: geo.carcassInnerWidth, width: ns.height - 2 * ns.sideThicknessMm, thicknessMm: thinMaterial.thicknessMm },
      quantity: 1,
      materialId: thinMaterial.id,
      grainDirection: 'none',
      rotationAllowed: true,
      edgeBanding: defaultEdgeBanding(),
      machiningOperations: [],
      assembly: [
        { toPartId: `${prefix}SIDE-L-01`, joinType: 'glue' },
        { toPartId: `${prefix}SIDE-R-01`, joinType: 'glue' },
      ],
    };

    parts.push(sideL, sideR, top, bottom, back);

    geo.drawers.forEach((drawer, i) => {
      const dIdx = String(i + 1).padStart(2, '0');
      const dPrefix = `${prefix}DRAWER-${dIdx}-`;

      const front: Part = {
        id: `${dPrefix}FRONT`,
        name: `${itemName} ${unit} drawer ${i + 1} front`,
        nameAr: `واجهة درج ${i + 1} — ${itemName} ${unit}`,
        componentId,
        dimensions: { length: geo.carcassInnerWidth, width: drawer.frontHeight, thicknessMm: ns.sideThicknessMm },
        quantity: 1,
        materialId: ns.materialId,
        grainDirection: 'length',
        rotationAllowed: false,
        edgeBanding: { top: true, bottom: true, left: true, right: true },
        machiningOperations: [{ type: 'drill', description: 'Handle fixing holes', descriptionAr: 'ثقوب تثبيت المقبض' }],
        assembly: [{ toPartId: `${dPrefix}BOX-SIDE-L`, joinType: 'screw', fastenerCount: 2 }],
      };
      const boxSideL: Part = {
        id: `${dPrefix}BOX-SIDE-L`,
        name: `${itemName} ${unit} drawer ${i + 1} box side (L)`,
        nameAr: `جانب صندوق الدرج ${i + 1} — ${itemName} ${unit}`,
        componentId,
        dimensions: { length: drawer.boxDepth, width: drawer.boxHeight, thicknessMm: ns.sideThicknessMm },
        quantity: 1,
        materialId: ns.materialId,
        grainDirection: 'length',
        rotationAllowed: false,
        edgeBanding: { ...defaultEdgeBanding(), top: true },
        machiningOperations: [],
        assembly: [{ toPartId: `${prefix}SIDE-L-01`, joinType: 'slide-runner', note: 'Ball-bearing drawer slide' }],
      };
      const boxSideR: Part = { ...boxSideL, id: `${dPrefix}BOX-SIDE-R`, name: `${itemName} ${unit} drawer ${i + 1} box side (R)` };
      const boxBack: Part = {
        id: `${dPrefix}BOX-BACK`,
        name: `${itemName} ${unit} drawer ${i + 1} box back`,
        nameAr: `خلفية صندوق الدرج ${i + 1} — ${itemName} ${unit}`,
        componentId,
        dimensions: { length: drawer.boxWidth, width: drawer.boxHeight, thicknessMm: ns.sideThicknessMm },
        quantity: 1,
        materialId: ns.materialId,
        grainDirection: 'length',
        rotationAllowed: false,
        edgeBanding: defaultEdgeBanding(),
        machiningOperations: [],
        assembly: [
          { toPartId: `${dPrefix}BOX-SIDE-L`, joinType: 'dowel', fastenerCount: 2 },
          { toPartId: `${dPrefix}BOX-SIDE-R`, joinType: 'dowel', fastenerCount: 2 },
        ],
      };
      const boxBottom: Part = {
        id: `${dPrefix}BOX-BOTTOM`,
        name: `${itemName} ${unit} drawer ${i + 1} box bottom`,
        nameAr: `قاعدة صندوق الدرج ${i + 1} — ${itemName} ${unit}`,
        componentId,
        dimensions: { length: drawer.boxWidth, width: drawer.boxDepth, thicknessMm: thinMaterial.thicknessMm },
        quantity: 1,
        materialId: thinMaterial.id,
        grainDirection: 'none',
        rotationAllowed: true,
        edgeBanding: defaultEdgeBanding(),
        machiningOperations: [],
        assembly: [{ toPartId: `${dPrefix}BOX-SIDE-L`, joinType: 'glue' }],
      };

      parts.push(front, boxSideL, boxSideR, boxBack, boxBottom);
    });

    components.push({ id: componentId, name: `${itemName} ${unit}`, nameAr: `${itemName} ${unit}`, partIds: parts.filter((p) => p.componentId === componentId).map((p) => p.id) });
  }

  return { parts, components };
}
