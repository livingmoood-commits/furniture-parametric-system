export interface Placement {
  partId: string;
  /** Which copy of the part (a part with quantity 3 has instances 0,1,2). */
  instanceIndex: number;
  x: number; // mm from board's left edge
  y: number; // mm from board's bottom edge
  /** Placed footprint — equals part dimensions, swapped if rotated. */
  length: number;
  width: number;
  rotated: boolean;
}

export interface BoardInstance {
  boardInstanceId: string;
  boardId: string;
  materialId: string;
  length: number;
  width: number;
  thicknessMm: number;
  placements: Placement[];
  usedAreaMm2: number;
  wasteAreaMm2: number;
  efficiencyPct: number;
}

export interface UnplacedPart {
  partId: string;
  instanceIndex: number;
  reason: string;
  reasonAr: string;
}

export interface NestingResult {
  boards: BoardInstance[];
  unplacedParts: UnplacedPart[];
  totalBoardsUsed: number;
  overallEfficiencyPct: number;
}
