import { describe, expect, it } from 'vitest';
import { generateBoardDxf } from '../dxfExport';
import type { BoardInstance } from '../../models';

function makeBoard(): BoardInstance {
  return {
    boardInstanceId: 'BRD-TEST-01',
    boardId: 'BOARD-MEL-18',
    materialId: 'MAT-MEL-18',
    length: 2440,
    width: 1220,
    thicknessMm: 18,
    usedAreaMm2: 0,
    wasteAreaMm2: 0,
    efficiencyPct: 0,
    placements: [
      { partId: 'P1', instanceIndex: 0, x: 10, y: 20, length: 600, width: 400, rotated: false },
      { partId: 'P2', instanceIndex: 0, x: 700, y: 20, length: 400, width: 600, rotated: true },
      { partId: 'P3', instanceIndex: 1, x: 10, y: 500, length: 300, width: 300, rotated: false },
    ],
  };
}

describe('generateBoardDxf', () => {
  it('emits exactly one LWPOLYLINE per placement', () => {
    const board = makeBoard();
    const dxf = generateBoardDxf(board);
    const count = (dxf.match(/LWPOLYLINE/g) ?? []).length;
    expect(count).toBe(board.placements.length);
  });

  it('encodes each rectangle at its exact placement coordinates, unconverted', () => {
    const board = makeBoard();
    const dxf = generateBoardDxf(board);
    const p = board.placements[0];
    const expectedCorners = [
      [p.x, p.y],
      [p.x + p.length, p.y],
      [p.x + p.length, p.y + p.width],
      [p.x, p.y + p.width],
    ];
    for (const [x, y] of expectedCorners) {
      expect(dxf).toContain(`10\n${x}\n20\n${y}`);
    }
  });

  it('puts every entity on a layer named after the board material', () => {
    const board = makeBoard();
    const dxf = generateBoardDxf(board);
    const entityLayerMentions = (dxf.match(new RegExp(`8\\n${board.materialId}`, 'g')) ?? []).length;
    expect(entityLayerMentions).toBe(board.placements.length);
    expect(dxf).toContain(`2\n${board.materialId}`); // the LAYER table definition itself
  });
});
