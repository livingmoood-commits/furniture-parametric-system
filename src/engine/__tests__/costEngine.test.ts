import { describe, expect, it } from 'vitest';
import { computeBoardCost } from '../costEngine';
import { runNesting } from '../nesting/nestingEngine';
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

describe('computeBoardCost', () => {
  it('multiplies boards actually used by pricePerBoard when every used board has a price', () => {
    const parts = [makePart({ id: 'P-A', quantity: 3, dimensions: { length: 2000, width: 1100, thicknessMm: 18 } })];
    const board = makeBoard({ pricePerBoard: 250 });
    const nesting = runNesting(parts, [board], settings);

    const cost = computeBoardCost(nesting, [board]);

    expect(cost.hasUnknownPricing).toBe(false);
    expect(cost.unknownBoardIds).toHaveLength(0);
    expect(cost.lines).toHaveLength(1);
    expect(cost.lines[0].boardsUsed).toBe(nesting.totalBoardsUsed);
    expect(cost.lines[0].subtotal).toBe(nesting.totalBoardsUsed * 250);
    expect(cost.totalKnown).toBe(nesting.totalBoardsUsed * 250);
  });

  it('flags used boards with no recorded price instead of silently costing them at 0', () => {
    const parts = [makePart({ id: 'P-A', quantity: 1, dimensions: { length: 600, width: 400, thicknessMm: 18 } })];
    const board = makeBoard(); // no pricePerBoard
    const nesting = runNesting(parts, [board], settings);

    const cost = computeBoardCost(nesting, [board]);

    expect(nesting.totalBoardsUsed).toBeGreaterThan(0);
    expect(cost.hasUnknownPricing).toBe(true);
    expect(cost.unknownBoardIds).toEqual(['B-1']);
    expect(cost.lines[0].subtotal).toBeUndefined();
    expect(cost.totalKnown).toBe(0);
  });

  it('mixes known and unknown pricing across two different board specs without corrupting the known total', () => {
    const priced = makeBoard({ id: 'B-PRICED', materialId: 'MAT-1', thicknessMm: 18, pricePerBoard: 100 });
    const unpriced = makeBoard({ id: 'B-UNPRICED', materialId: 'MAT-2', thicknessMm: 6, qtyAvailable: 5 });
    const parts = [
      makePart({ id: 'P-A', materialId: 'MAT-1', dimensions: { length: 600, width: 400, thicknessMm: 18 } }),
      makePart({ id: 'P-B', materialId: 'MAT-2', dimensions: { length: 600, width: 400, thicknessMm: 6 } }),
    ];
    const nesting = runNesting(parts, [priced, unpriced], settings);

    const cost = computeBoardCost(nesting, [priced, unpriced]);

    expect(cost.hasUnknownPricing).toBe(true);
    expect(cost.unknownBoardIds).toEqual(['B-UNPRICED']);
    const pricedLine = cost.lines.find((l) => l.boardId === 'B-PRICED')!;
    expect(pricedLine.subtotal).toBe(pricedLine.boardsUsed * 100);
    expect(cost.totalKnown).toBe(pricedLine.subtotal);
  });

  it('counts boards actually used, not qtyAvailable', () => {
    const board = makeBoard({ pricePerBoard: 50, qtyAvailable: 50 });
    const parts = [makePart({ id: 'P-A', quantity: 1, dimensions: { length: 500, width: 400, thicknessMm: 18 } })];
    const nesting = runNesting(parts, [board], settings);

    const cost = computeBoardCost(nesting, [board]);
    expect(cost.lines[0].boardsUsed).toBe(1);
    expect(cost.totalKnown).toBe(50);
  });
});
