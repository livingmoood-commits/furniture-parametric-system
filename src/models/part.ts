export type GrainDirection = 'length' | 'width' | 'none';

export interface EdgeBanding {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
}

export const NO_EDGE_BANDING: EdgeBanding = { top: false, bottom: false, left: false, right: false };

export type MachiningType = 'drill' | 'groove' | 'route' | 'hinge-cup';

export interface MachiningOperation {
  type: MachiningType;
  description: string;
  descriptionAr?: string;
  /** Position on the part face, mm from the bottom-left corner, when relevant. */
  positionMm?: { x: number; y: number };
}

export type JoinType = 'screw' | 'dowel' | 'cam-lock' | 'glue' | 'hinge' | 'bracket' | 'slide-runner';

export interface AssemblyJoint {
  /** The other part this one connects to. */
  toPartId: string;
  joinType: JoinType;
  fastenerCount?: number;
  note?: string;
  noteAr?: string;
}

export interface SplitInfo {
  originalPartId: string;
  index: number; // 1-based
  of: number;
  axis: 'length' | 'width';
}

/** A single cuttable piece of board. This is the atomic unit of the whole pipeline. */
export interface Part {
  /** Stable engineering id, e.g. BED-SIDE-R-01. Never regenerated once assigned within a run. */
  id: string;
  name: string;
  nameAr?: string;
  componentId: string;
  dimensions: {
    length: number; // mm, grain runs along this axis when grainDirection === 'length'
    width: number; // mm
    thicknessMm: number;
  };
  quantity: number;
  materialId: string;
  grainDirection: GrainDirection;
  /** Whether the nesting engine may rotate this part 90 deg to fit. False when grain direction is fixed. */
  rotationAllowed: boolean;
  edgeBanding: EdgeBanding;
  machiningOperations: MachiningOperation[];
  assembly: AssemblyJoint[];
  /** Set when a source dimension was ambiguous/contradictory and a value had to be chosen transparently. */
  sourceFlag?: string;
  /** Set when this part is one half of a larger part that didn't fit any available board. */
  splitInfo?: SplitInfo;
}
