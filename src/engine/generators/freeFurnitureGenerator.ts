import type { Component, FreeFurnitureItem, Part } from '../../models';

export interface FreeFurnitureGenerationResult {
  parts: Part[];
  components: Component[];
}

/**
 * "Free parts" mode: no geometric rules link the pieces together — the user supplies
 * every dimension directly. Still feeds the same Part shape so cutting list, nesting,
 * drawings and QC treat it identically to the parametric bed/nightstand.
 */
export function generateFreeFurnitureParts(items: FreeFurnitureItem[]): FreeFurnitureGenerationResult {
  const parts: Part[] = [];
  const components: Component[] = [];

  for (const item of items) {
    const componentId = `COMP-FREE-${item.id}`;
    const partIds: string[] = [];

    for (const fp of item.parts) {
      const part: Part = {
        id: fp.id,
        name: fp.name,
        componentId,
        dimensions: { length: fp.length, width: fp.width, thicknessMm: fp.thicknessMm },
        quantity: fp.quantity,
        materialId: fp.materialId,
        grainDirection: fp.grainDirection,
        rotationAllowed: fp.grainDirection === 'none',
        edgeBanding: fp.edgeBanding,
        machiningOperations: [],
        assembly: [],
        sourceFlag: fp.notes ? `User note: ${fp.notes}` : undefined,
      };
      parts.push(part);
      partIds.push(part.id);
    }

    components.push({ id: componentId, name: item.name, partIds });
  }

  return { parts, components };
}
