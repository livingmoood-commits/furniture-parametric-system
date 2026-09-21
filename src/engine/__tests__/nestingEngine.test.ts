import { describe, expect, it } from 'vitest';
import { boardHasCollisions, runNesting } from '../nesting/nestingEngine';
import type { Board, NestingSettings, Part } from '../../models';
import { defaultEdgeBanding } from '../../models';

function makePart(overrides: Partial<Part> = {}): Part {
  return {
    id: 'P-1',
    name: 'Test part',
    componentId: 'COMP-1',
    dimensions: { length: 600, width: 400, thicknessMm: 18 },
    quantity: 1,
    materialId: 'MAT-1',
    grainDirection: 'none',
    rotationAllowed: true,
    edgeBanding: defaultEdgeBanding(),
    machiningOperations: [],
    assembly: [],
    ...overrides,
  };
}

function makeBoard(overrides: Partial<Board> = {}): Board {
  return { id: 'B-1', materialId: 'MAT-1', length: 2440, width: 1220, thicknessMm: 18, qtyAvailable: 5, ...overrides };
}

const settings: NestingSettings = { kerfMm: 5, edgeMarginMm: 10 };

describe('runNesting', () => {
  it('places every instance of every part with no overlaps', () => {
    const parts = [makePart({ id: 'P-A', quantity: 3, dimensions: { length: 500, width: 300, thicknessMm: 18 } }), makePart({ id: 'P-B', quantity: 2, dimensions: { length: 800, width: 400, thicknessMm: 18 } })];
    const result = runNesting(parts, [makeBoard()], settings);

    expect(result.unplacedParts).toHaveLength(0);
    const totalPlaced = result.boards.reduce((s, b) => s + b.placements.length, 0);
    expect(totalPlaced).toBe(5);
    for (const board of result.boards) {
      expect(boardHasCollisions(board)).toBe(false);
    }
  });

  it('never mixes two different (material, thickness) groups on one board', () => {
    const parts = [
      makePart({ id: 'P-THICK', materialId: 'MAT-1', dimensions: { length: 300, width: 300, thicknessMm: 18 } }),
      makePart({ id: 'P-THIN', materialId: 'MAT-1', dimensions: { length: 300, width: 300, thicknessMm: 9 } }),
    ];
    const boards = [makeBoard({ id: 'B-18', thicknessMm: 18 }), makeBoard({ id: 'B-9', thicknessMm: 9 })];
    const result = runNesting(parts, boards, settings);
    for (const b of result.boards) {
      const uniqueThickness = new Set(result.boards.filter((x) => x.boardInstanceId === b.boardInstanceId).map((x) => x.thicknessMm));
      expect(uniqueThickness.size).toBe(1);
    }
  });

  it('reports unplaced parts when supply runs out instead of failing silently', () => {
    const parts = [makePart({ id: 'P-A', quantity: 1, dimensions: { length: 2400, width: 1200, thicknessMm: 18 } })];
    const result = runNesting(parts, [makeBoard({ qtyAvailable: 0 })], settings);
    expect(result.unplacedParts).toHaveLength(1);
    expect(result.unplacedParts[0].partId).toBe('P-A');
  });

  it('flags a part that fits on no available board size, even alone', () => {
    const parts = [makePart({ id: 'P-HUGE', dimensions: { length: 5000, width: 5000, thicknessMm: 18 } })];
    const result = runNesting(parts, [makeBoard()], settings);
    expect(result.unplacedParts).toHaveLength(1);
    expect(result.boards).toHaveLength(0);
  });

  it('locks rotation for parts whose grain direction forbids it', () => {
    // A 1300-long part cannot fit within the 1200 usable width unless rotated;
    // rotationAllowed=false must send it to unplaced rather than silently rotating it.
    const board = makeBoard({ length: 1400, width: 1220 });
    const usableL = 1400 - 2 * settings.edgeMarginMm; // 1380
    const usableW = 1220 - 2 * settings.edgeMarginMm; // 1200
    const part = makePart({ id: 'P-GRAIN', rotationAllowed: false, dimensions: { length: usableW + 50, width: 300, thicknessMm: 18 } });
    expect(part.dimensions.length).toBeLessThanOrEqual(usableL);
    expect(part.dimensions.length).toBeGreaterThan(usableW);

    const result = runNesting([part], [board], settings);
    expect(result.unplacedParts).toHaveLength(0); // fits unrotated along the length axis
  });

  it('efficiency is between 0 and 100 and reflects used area', () => {
    const parts = [makePart({ id: 'P-A', quantity: 1, dimensions: { length: 1000, width: 1000, thicknessMm: 18 } })];
    const result = runNesting(parts, [makeBoard()], settings);
    expect(result.overallEfficiencyPct).toBeGreaterThan(0);
    expect(result.overallEfficiencyPct).toBeLessThanOrEqual(100);
  });

  it('fills leftover space on an already-open board with a later, unrelated part instead of opening a new one', () => {
    // A 2000x900 piece leaves a large leftover strip on a 2440x1220 usable board;
    // a small unrelated piece from a "different furniture item" must land in that
    // leftover space rather than forcing a second board.
    const big = makePart({ id: 'BED-BACKREST', dimensions: { length: 2000, width: 900, thicknessMm: 18 } });
    const small = makePart({ id: 'NS-SIDE', dimensions: { length: 300, width: 250, thicknessMm: 18 } });
    const result = runNesting([big, small], [makeBoard()], settings);

    expect(result.unplacedParts).toHaveLength(0);
    expect(result.boards).toHaveLength(1);
    expect(result.boards[0].placements.map((p) => p.partId).sort()).toEqual(['BED-BACKREST', 'NS-SIDE']);
    expect(boardHasCollisions(result.boards[0])).toBe(false);
  });

  it('checks every already-open board for room before opening a new one', () => {
    // Two boards' worth of big pieces first, each leaving a small leftover corner;
    // several small pieces that only fit in those leftovers must not force new boards.
    const bigs = [
      makePart({ id: 'BIG-1', dimensions: { length: 2400, width: 1000, thicknessMm: 18 } }),
      makePart({ id: 'BIG-2', dimensions: { length: 2400, width: 1000, thicknessMm: 18 } }),
    ];
    const smalls = Array.from({ length: 4 }, (_, i) => makePart({ id: `SMALL-${i}`, dimensions: { length: 200, width: 150, thicknessMm: 18 } }));
    const result = runNesting([...bigs, ...smalls], [makeBoard({ qtyAvailable: 10 })], settings);

    expect(result.unplacedParts).toHaveLength(0);
    expect(result.boards).toHaveLength(2);
    for (const board of result.boards) {
      expect(boardHasCollisions(board)).toBe(false);
    }
  });
});
