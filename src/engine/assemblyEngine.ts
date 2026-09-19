import type { JoinType, Part } from '../models';

export interface AssemblyInstruction {
  partId: string;
  partName: string;
  toPartId: string;
  toPartName: string;
  joinType: JoinType;
  fastenerCount?: number;
  note?: string;
}

/** Reads every part's own `assembly[]` field — Section 09 is never hand-written. */
export function buildAssemblyInstructions(parts: Part[]): AssemblyInstruction[] {
  const byId = new Map(parts.map((p) => [p.id, p]));
  const out: AssemblyInstruction[] = [];
  for (const part of parts) {
    for (const joint of part.assembly) {
      const target = byId.get(joint.toPartId);
      out.push({
        partId: part.id,
        partName: part.nameAr ?? part.name,
        toPartId: joint.toPartId,
        toPartName: target ? target.nameAr ?? target.name : joint.toPartId,
        joinType: joint.joinType,
        fastenerCount: joint.fastenerCount,
        note: joint.noteAr ?? joint.note,
      });
    }
  }
  return out;
}
