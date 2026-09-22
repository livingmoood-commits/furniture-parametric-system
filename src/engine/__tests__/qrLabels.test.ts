import { describe, expect, it } from 'vitest';
import { buildPartLabels } from '../qrLabels';
import type { BoardInstance, Part } from '../../models';
import { NO_EDGE_BANDING } from '../../models';

function makePart(overrides: Partial<Part> = {}): Part {
  return {
    id: 'PART-1',
    name: 'Test Part',
    nameAr: 'قطعة تجريبية',
    componentId: 'COMP-1',
    dimensions: { length: 600, width: 400, thicknessMm: 18 },
    quantity: 3,
    materialId: 'MAT-1',
    grainDirection: 'none',
    rotationAllowed: true,
    edgeBanding: NO_EDGE_BANDING,
    machiningOperations: [],
    assembly: [],
    ...overrides,
  };
}

describe('buildPartLabels', () => {
  it('produces exactly one label per physical instance (quantity 3 -> 3 labels)', () => {
    const labels = buildPartLabels([makePart()], [], 'مشروعي');
    expect(labels).toHaveLength(3);
    expect(labels.map((l) => l.instanceIndex)).toEqual([0, 1, 2]);
  });

  it('gives every instance of the same part a distinct QR payload', () => {
    const labels = buildPartLabels([makePart()], [], 'مشروعي');
    const payloads = new Set(labels.map((l) => l.qrPayload));
    expect(payloads.size).toBe(labels.length);
  });

  it('embeds partId, dimensions, and projectName in each QR payload', () => {
    const labels = buildPartLabels([makePart()], [], 'مشروعي');
    for (const label of labels) {
      const decoded = JSON.parse(label.qrPayload);
      expect(decoded.partId).toBe('PART-1');
      expect(decoded.dimensions).toEqual({ length: 600, width: 400, thicknessMm: 18 });
      expect(decoded.projectName).toBe('مشروعي');
      expect(decoded.instanceIndex).toBe(label.instanceIndex);
    }
  });

  it('resolves each instance to the board it was actually nested onto', () => {
    const boards: BoardInstance[] = [
      {
        boardInstanceId: 'BRD-01',
        boardId: 'BOARD-1',
        materialId: 'MAT-1',
        length: 2440,
        width: 1220,
        thicknessMm: 18,
        usedAreaMm2: 0,
        wasteAreaMm2: 0,
        efficiencyPct: 0,
        placements: [
          { partId: 'PART-1', instanceIndex: 0, x: 0, y: 0, length: 600, width: 400, rotated: false },
          { partId: 'PART-1', instanceIndex: 1, x: 600, y: 0, length: 600, width: 400, rotated: false },
        ],
      },
    ];
    const labels = buildPartLabels([makePart()], boards, 'مشروعي');
    expect(labels[0].boardInstanceId).toBe('BRD-01');
    expect(labels[1].boardInstanceId).toBe('BRD-01');
    expect(labels[2].boardInstanceId).toBeUndefined(); // instance 2 was never nested
  });
});
