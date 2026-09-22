import type { Board, NestingResult } from '../models';

export interface BoardCostLine {
  boardId: string;
  materialId: string;
  /** How many physical boards of this exact spec the nesting result actually used. */
  boardsUsed: number;
  pricePerBoard: number | undefined;
  /** undefined when pricePerBoard is undefined — never silently treated as 0. */
  subtotal: number | undefined;
}

export interface CostSummary {
  lines: BoardCostLine[];
  /** Sum of every line whose subtotal is known. Not the "total cost" unless hasUnknownPricing is false. */
  totalKnown: number;
  hasUnknownPricing: boolean;
  /** Board ids that were actually used but have no pricePerBoard recorded. */
  unknownBoardIds: string[];
}

/**
 * Board cost only — counts each Board spec by how many physical sheets the nesting
 * result actually consumed (nesting.boards.length per boardId), not qtyAvailable. A used
 * board with no pricePerBoard recorded is called out explicitly via hasUnknownPricing
 * rather than being folded into totalKnown as if it cost nothing.
 */
export function computeBoardCost(nesting: NestingResult, boards: Board[]): CostSummary {
  const boardSpecById = new Map(boards.map((b) => [b.id, b]));
  const usedCountByBoardId = new Map<string, number>();
  for (const used of nesting.boards) {
    usedCountByBoardId.set(used.boardId, (usedCountByBoardId.get(used.boardId) ?? 0) + 1);
  }

  const lines: BoardCostLine[] = [];
  let totalKnown = 0;
  const unknownBoardIds: string[] = [];

  for (const [boardId, boardsUsed] of usedCountByBoardId) {
    const spec = boardSpecById.get(boardId);
    const pricePerBoard = spec?.pricePerBoard;
    const subtotal = pricePerBoard !== undefined ? pricePerBoard * boardsUsed : undefined;
    if (subtotal !== undefined) {
      totalKnown += subtotal;
    } else {
      unknownBoardIds.push(boardId);
    }
    lines.push({ boardId, materialId: spec?.materialId ?? '', boardsUsed, pricePerBoard, subtotal });
  }

  return { lines, totalKnown, hasUnknownPricing: unknownBoardIds.length > 0, unknownBoardIds };
}
