import { describe, expect, it } from 'vitest';
import { deriveProject } from '../derive';
import { boardHasCollisions } from '../nesting/nestingEngine';
import { createDefaultProject } from '../../data/defaultProject';
import type { BedFurnitureItem, FreeFurnitureItem, FurnitureItem } from '../../models';

describe('deriveProject — One Source of Truth pipeline', () => {
  it('produces a fully consistent derivation for the default reference project', () => {
    const project = createDefaultProject();
    const derived = deriveProject(project);

    expect(derived.parts.length).toBeGreaterThan(0);
    expect(derived.nesting.totalBoardsUsed).toBeGreaterThan(0);
    expect(derived.nesting.unplacedParts).toHaveLength(0);

    for (const board of derived.nesting.boards) {
      expect(boardHasCollisions(board)).toBe(false);
    }

    // every placed instance must reference a real part id
    const partIds = new Set(derived.parts.map((p) => p.id));
    for (const board of derived.nesting.boards) {
      for (const placement of board.placements) {
        expect(partIds.has(placement.partId)).toBe(true);
      }
    }

    // QC checklist must always resolve to a boolean per item, never undefined
    for (const item of derived.qc) {
      expect(typeof item.passed).toBe('boolean');
    }
  });

  it('re-deriving after changing mattress.width changes the cutting list without manual edits', () => {
    const project = createDefaultProject();
    const before = deriveProject(project);

    const bedItem = project.furniture.find((f): f is BedFurnitureItem => f.kind === 'bed')!;
    const widened: FurnitureItem[] = project.furniture.map((f) =>
      f.id === bedItem.id ? { ...bedItem, spec: { ...bedItem.spec, mattress: { ...bedItem.spec.mattress, width: bedItem.spec.mattress.width + 200 } } } : f
    );
    const after = deriveProject({ ...project, furniture: widened });

    // width feeds outerWidth, which drives the head/foot base panels (not the side rails,
    // which run along outerLength and are correctly unaffected by a width-only change).
    const beforeHead = before.parts.find((p) => p.id === `${bedItem.id}-HEAD-BASE-01`)!;
    const afterHead = after.parts.find((p) => p.id === `${bedItem.id}-HEAD-BASE-01`)!;
    expect(afterHead.dimensions.length).toBe(beforeHead.dimensions.length + 200);
  });

  it('removing the bed item removes every one of its parts and its hardware', () => {
    const project = createDefaultProject();
    const bedItem = project.furniture.find((f): f is BedFurnitureItem => f.kind === 'bed')!;
    const withoutBed = { ...project, furniture: project.furniture.filter((f) => f.id !== bedItem.id) };
    const derived = deriveProject(withoutBed);

    expect(derived.parts.some((p) => p.id.startsWith(`${bedItem.id}-`))).toBe(false);
    expect(derived.hardware.some((h) => h.id === `HW-${bedItem.id}-MECHANISM`)).toBe(false);
  });

  it('free furniture parts flow through the same cutting-list/nesting/QC pipeline as the bed', () => {
    const project = createDefaultProject();
    const freeItem: FreeFurnitureItem = {
      id: 'FREE-1',
      kind: 'wardrobe',
      name: 'دولاب تجريبي',
      parts: [
        {
          id: 'WD-SIDE-01',
          name: 'Wardrobe side',
          length: 2000,
          width: 500,
          thicknessMm: 18,
          quantity: 2,
          materialId: project.materials[0].id,
          grainDirection: 'length',
          edgeBanding: { top: true, bottom: false, left: false, right: false },
        },
      ],
    };
    const onlyFree = { ...project, furniture: [freeItem] };

    const derived = deriveProject(onlyFree);
    expect(derived.parts).toHaveLength(1);
    expect(derived.parts[0].quantity).toBe(2);
    expect(derived.nesting.totalBoardsUsed).toBeGreaterThan(0);
  });

  it('two bed items in the same project get independent, non-colliding part ids', () => {
    const project = createDefaultProject();
    const bedItem = project.furniture.find((f): f is BedFurnitureItem => f.kind === 'bed')!;
    const secondBed: BedFurnitureItem = { ...bedItem, id: 'BED-2', name: 'سرير 2' };
    const derived = deriveProject({ ...project, furniture: [...project.furniture, secondBed] });

    expect(derived.parts.some((p) => p.id.startsWith('BED-1-'))).toBe(true);
    expect(derived.parts.some((p) => p.id.startsWith('BED-2-'))).toBe(true);
    expect(derived.nesting.unplacedParts).toHaveLength(0);
  });
});
