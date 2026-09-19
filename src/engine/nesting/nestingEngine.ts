import type { Board, BoardInstance, NestingResult, NestingSettings, Part, Placement, UnplacedPart } from '../../models';

interface Instance {
  partId: string;
  instanceIndex: number;
  length: number;
  width: number;
  materialId: string;
  thicknessMm: number;
  rotationAllowed: boolean;
}

function flatten(parts: Part[]): Instance[] {
  const out: Instance[] = [];
  for (const p of parts) {
    for (let i = 0; i < p.quantity; i++) {
      out.push({
        partId: p.id,
        instanceIndex: i,
        length: p.dimensions.length,
        width: p.dimensions.width,
        materialId: p.materialId,
        thicknessMm: p.dimensions.thicknessMm,
        rotationAllowed: p.rotationAllowed,
      });
    }
  }
  return out;
}

function groupKey(materialId: string, thicknessMm: number) {
  return `${materialId}::${thicknessMm}`;
}

function mkPlacement(inst: Instance, x: number, y: number, o: { l: number; w: number; rotated: boolean }): Placement {
  return { partId: inst.partId, instanceIndex: inst.instanceIndex, x, y, length: o.l, width: o.w, rotated: o.rotated };
}

/** Greedy shelf-packing pass over a single fresh board: places what fits, returns the rest. */
function packOneBoard(instances: Instance[], spec: Board, settings: NestingSettings) {
  const usableL = spec.length - 2 * settings.edgeMarginMm;
  const usableW = spec.width - 2 * settings.edgeMarginMm;
  const placements: Placement[] = [];
  const stillRemaining: Instance[] = [];

  let shelfY = 0;
  let shelfHeight = 0;
  let cursorX = 0;
  let haveShelf = false;

  for (const inst of instances) {
    const orientations: Array<{ l: number; w: number; rotated: boolean }> = [{ l: inst.length, w: inst.width, rotated: false }];
    if (inst.rotationAllowed) orientations.push({ l: inst.width, w: inst.length, rotated: true });
    const feasible = orientations.filter((o) => o.l <= usableL && o.w <= usableW);

    if (feasible.length === 0) {
      stillRemaining.push(inst);
      continue;
    }

    let placedHere = false;

    // 1) does it fit in the current shelf row?
    for (const o of feasible) {
      if (haveShelf && cursorX + o.l <= usableL && o.w <= shelfHeight) {
        placements.push(mkPlacement(inst, cursorX, shelfY, o));
        cursorX += o.l + settings.kerfMm;
        placedHere = true;
        break;
      }
    }
    if (placedHere) continue;

    // 2) open a new shelf row
    for (const o of feasible) {
      const newShelfY = haveShelf ? shelfY + shelfHeight + settings.kerfMm : 0;
      if (newShelfY + o.w <= usableW) {
        shelfY = newShelfY;
        shelfHeight = o.w;
        cursorX = o.l + settings.kerfMm;
        haveShelf = true;
        placements.push(mkPlacement(inst, 0, shelfY, o));
        placedHere = true;
        break;
      }
    }

    if (!placedHere) stillRemaining.push(inst);
  }

  return { placements, stillRemaining };
}

function unplacedEntry(inst: Instance, reason: string, reasonAr: string): UnplacedPart {
  return { partId: inst.partId, instanceIndex: inst.instanceIndex, reason, reasonAr };
}

function nestGroup(instances: Instance[], boardSpecs: Board[], settings: NestingSettings, counter: { n: number }) {
  const boards: BoardInstance[] = [];
  const unplaced: UnplacedPart[] = [];
  const supply = new Map(boardSpecs.map((b) => [b.id, b.qtyAvailable]));

  let remaining = [...instances].sort((a, b) => Math.max(b.length, b.width) - Math.max(a.length, a.width));

  while (remaining.length > 0) {
    const specsWithSupply = boardSpecs.filter((b) => (supply.get(b.id) ?? 0) > 0);
    if (specsWithSupply.length === 0) {
      remaining.forEach((inst) => unplaced.push(unplacedEntry(inst, 'Out of board stock for this material/thickness', 'الألواح المتاحة لهذه الخامة والسمك خلصت')));
      break;
    }

    let placedOnAnyBoard = false;
    for (const spec of specsWithSupply) {
      const attempt = packOneBoard(remaining, spec, settings);
      if (attempt.placements.length > 0) {
        supply.set(spec.id, (supply.get(spec.id) ?? 0) - 1);
        counter.n++;
        const usedAreaMm2 = attempt.placements.reduce((s, p) => s + p.length * p.width, 0);
        const totalAreaMm2 = spec.length * spec.width;
        boards.push({
          boardInstanceId: `BRD-${String(counter.n).padStart(2, '0')}`,
          boardId: spec.id,
          materialId: spec.materialId,
          length: spec.length,
          width: spec.width,
          thicknessMm: spec.thicknessMm,
          placements: attempt.placements,
          usedAreaMm2,
          wasteAreaMm2: totalAreaMm2 - usedAreaMm2,
          efficiencyPct: totalAreaMm2 > 0 ? (usedAreaMm2 / totalAreaMm2) * 100 : 0,
        });
        remaining = attempt.stillRemaining;
        placedOnAnyBoard = true;
        break;
      }
    }

    if (!placedOnAnyBoard) {
      remaining.forEach((inst) => unplaced.push(unplacedEntry(inst, 'Does not fit on any available board size, even alone', 'القطعة لا تتحط في أي لوح متاح حتى لوحدها')));
      break;
    }
  }

  return { boards, unplaced };
}

/**
 * Groups instances by (material, thickness) — never mixes an 18mm and 9mm panel on the
 * same virtual stack — then shelf-packs each group onto fresh boards until everything is
 * placed or flagged unplaced. Kerf is spacing between parts, never subtracted from a part's
 * own size.
 */
export function runNesting(parts: Part[], boards: Board[], settings: NestingSettings): NestingResult {
  const instances = flatten(parts);
  const groups = new Map<string, Instance[]>();
  for (const inst of instances) {
    const key = groupKey(inst.materialId, inst.thicknessMm);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(inst);
  }

  const allBoards: BoardInstance[] = [];
  const allUnplaced: UnplacedPart[] = [];
  const counter = { n: 0 };

  for (const [key, groupInstances] of groups) {
    const [materialId, thicknessStr] = key.split('::');
    const thicknessMm = Number(thicknessStr);
    const matchingBoards = boards.filter((b) => b.materialId === materialId && b.thicknessMm === thicknessMm);

    if (matchingBoards.length === 0) {
      groupInstances.forEach((inst) =>
        allUnplaced.push(unplacedEntry(inst, `No board stock defined for material ${materialId} @ ${thicknessMm}mm`, `مفيش لوح معرّف لخامة ${materialId} بسمك ${thicknessMm}مم`))
      );
      continue;
    }

    const { boards: groupBoards, unplaced: groupUnplaced } = nestGroup(groupInstances, matchingBoards, settings, counter);
    allBoards.push(...groupBoards);
    allUnplaced.push(...groupUnplaced);
  }

  const totalUsed = allBoards.reduce((s, b) => s + b.usedAreaMm2, 0);
  const totalArea = allBoards.reduce((s, b) => s + b.length * b.width, 0);

  return {
    boards: allBoards,
    unplacedParts: allUnplaced,
    totalBoardsUsed: allBoards.length,
    overallEfficiencyPct: totalArea > 0 ? (totalUsed / totalArea) * 100 : 0,
  };
}

export function rectanglesOverlap(a: Placement, b: Placement): boolean {
  return !(a.x + a.length <= b.x || b.x + b.length <= a.x || a.y + a.width <= b.y || b.y + b.width <= a.y);
}

/** Self-check the engine must always pass: no two placements on the same board may overlap. */
export function boardHasCollisions(board: BoardInstance): boolean {
  const p = board.placements;
  for (let i = 0; i < p.length; i++) {
    for (let j = i + 1; j < p.length; j++) {
      if (rectanglesOverlap(p[i], p[j])) return true;
    }
  }
  return false;
}
