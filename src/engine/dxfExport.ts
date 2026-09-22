import type { BoardInstance } from '../models';

/**
 * CNC-ready DXF for one board: one closed LWPOLYLINE rectangle per placement, in the
 * board's EXACT mm coordinates (never converted to the UI's displayUnit — a CNC controller
 * only understands the real dimensions), on a layer named after the board's material.
 */
export function generateBoardDxf(board: BoardInstance): string {
  const layer = board.materialId;

  const layerTable = [
    '0', 'SECTION', '2', 'TABLES',
    '0', 'TABLE', '2', 'LAYER', '70', '1',
    '0', 'LAYER', '2', layer, '70', '0', '62', '7', '6', 'CONTINUOUS',
    '0', 'ENDTAB',
    '0', 'ENDSEC',
  ];

  const entities: string[] = ['0', 'SECTION', '2', 'ENTITIES'];
  for (const p of board.placements) {
    const corners: Array<[number, number]> = [
      [p.x, p.y],
      [p.x + p.length, p.y],
      [p.x + p.length, p.y + p.width],
      [p.x, p.y + p.width],
    ];
    entities.push('0', 'LWPOLYLINE', '8', layer, '90', '4', '70', '1');
    for (const [x, y] of corners) {
      entities.push('10', String(x), '20', String(y));
    }
  }
  entities.push('0', 'ENDSEC');

  return ['0', 'SECTION', '2', 'HEADER', '0', 'ENDSEC', ...layerTable, ...entities, '0', 'EOF'].join('\n');
}

export function downloadBoardDxf(board: BoardInstance): void {
  const dxf = generateBoardDxf(board);
  const blob = new Blob([dxf], { type: 'application/dxf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${board.boardInstanceId}.dxf`;
  a.click();
  URL.revokeObjectURL(url);
}
