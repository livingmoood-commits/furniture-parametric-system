import { describe, expect, it } from 'vitest';
import { deriveProject } from '../derive';
import { boardHasCollisions } from '../nesting/nestingEngine';
import { createDefaultProject } from '../../data/defaultProject';

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

    const widened = { ...project, bed: { ...project.bed, mattress: { ...project.bed.mattress, width: project.bed.mattress.width + 200 } } };
    const after = deriveProject(widened);

    // width feeds outerWidth, which drives the head/foot base panels (not the side rails,
    // which run along outerLength and are correctly unaffected by a width-only change).
    const beforeHead = before.parts.find((p) => p.id === 'BED-HEAD-BASE-01')!;
    const afterHead = after.parts.find((p) => p.id === 'BED-HEAD-BASE-01')!;
    expect(afterHead.dimensions.length).toBe(beforeHead.dimensions.length + 200);
  });

  it('disabling the bed removes every BED- part and its hardware', () => {
    const project = createDefaultProject();
    const withoutBed = { ...project, bed: { ...project.bed, enabled: false } };
    const derived = deriveProject(withoutBed);

    expect(derived.parts.some((p) => p.id.startsWith('BED-'))).toBe(false);
    expect(derived.hardware.some((h) => h.id === 'HW-BED-MECHANISM')).toBe(false);
  });

  it('free furniture parts flow through the same cutting-list/nesting/QC pipeline as the bed', () => {
    const project = createDefaultProject();
    const withFree = {
      ...project,
      bed: { ...project.bed, enabled: false },
      nightstand: { ...project.nightstand, enabled: false },
      freeFurniture: [
        {
          id: 'FREE-1',
          name: 'دولاب تجريبي',
          category: 'wardrobe' as const,
          parts: [
            {
              id: 'WD-SIDE-01',
              name: 'Wardrobe side',
              length: 2000,
              width: 500,
              thicknessMm: 18,
              quantity: 2,
              materialId: project.materials[0].id,
              grainDirection: 'length' as const,
              edgeBanding: { top: true, bottom: false, left: false, right: false },
            },
          ],
        },
      ],
    };

    const derived = deriveProject(withFree);
    expect(derived.parts).toHaveLength(1);
    expect(derived.parts[0].quantity).toBe(2);
    expect(derived.nesting.totalBoardsUsed).toBeGreaterThan(0);
  });
});
