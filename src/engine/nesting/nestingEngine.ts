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

interface FreeRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** true if `a` is fully inside `b` (including touching edges). */
function isContained(a: FreeRect, b: FreeRect): boolean {
  return a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h;
}

/** Splits one free rectangle against a just-placed footprint into up to 4 leftover rectangles. */
function splitFreeRect(fr: FreeRect, placed: FreeRect): FreeRect[] {
  const noOverlap = placed.x >= fr.x + fr.w || placed.x + placed.w <= fr.x || placed.y >= fr.y + fr.h || placed.y + placed.h <= fr.y;
  if (noOverlap) return [fr];

  const out: FreeRect[] = [];
  if (placed.x > fr.x) out.push({ x: fr.x, y: fr.y, w: placed.x - fr.x, h: fr.h });
  if (placed.x + placed.w < fr.x + fr.w) out.push({ x: placed.x + placed.w, y: fr.y, w: fr.x + fr.w - (placed.x + placed.w), h: fr.h });
  if (placed.y > fr.y) out.push({ x: fr.x, y: fr.y, w: fr.w, h: placed.y - fr.y });
  if (placed.y + placed.h < fr.y + fr.h) out.push({ x: fr.x, y: placed.y + placed.h, w: fr.w, h: fr.y + fr.h - (placed.y + placed.h) });
  return out.filter((r) => r.w > 0.001 && r.h > 0.001);
}

/** Drops any free rectangle that's fully swallowed by another, keeping the list small and valid. */
function pruneFreeRects(rects: FreeRect[]): FreeRect[] {
  const kept: FreeRect[] = [];
  for (let i = 0; i < rects.length; i++) {
    let redundant = false;
    for (let j = 0; j < rects.length; j++) {
      if (i === j) continue;
      if (isContained(rects[i], rects[j]) && (!isContained(rects[j], rects[i]) || j < i)) {
        redundant = true;
        break;
      }
    }
    if (!redundant) kept.push(rects[i]);
  }
  return kept;
}

function mkPlacement(inst: Instance, x: number, y: number, o: { l: number; w: number; rotated: boolean }): Placement {
  return { partId: inst.partId, instanceIndex: inst.instanceIndex, x, y, length: o.l, width: o.w, rotated: o.rotated };
}

function unplacedEntry(inst: Instance, reason: string, reasonAr: string): UnplacedPart {
  return { partId: inst.partId, instanceIndex: inst.instanceIndex, reason, reasonAr };
}

interface OpenBoard {
  boardInstanceId: string;
  spec: Board;
  freeRects: FreeRect[];
  placements: Placement[];
}

function boardArea(o: OpenBoard) {
  return o.spec.length * o.spec.width;
}

/**
 * Maximal Rectangles bin packing (Best Short Side Fit heuristic), checked across every
 * board opened so far before ever opening a new one — the same family of algorithm real
 * cutting-optimization tools use, and far better at using leftover space than
 * shelf-packing or a "fill this board, then move on" approach: once a big piece like a
 * headboard is placed, the gaps beside and below it stay available for a completely
 * different item (e.g. a nightstand shelf) on the SAME board, and a new board is opened
 * only when nothing already open has room.
 */
function nestGroup(instances: Instance[], boardSpecs: Board[], settings: NestingSettings, counter: { n: number }) {
  const unplaced: UnplacedPart[] = [];
  const supply = new Map(boardSpecs.map((b) => [b.id, b.qtyAvailable]));
  const openBoards: OpenBoard[] = [];

  const sorted = [...instances].sort((a, b) => Math.max(b.length, b.width) - Math.max(a.length, a.width));

  for (const inst of sorted) {
    const orientations: Array<{ l: number; w: number; rotated: boolean }> = [{ l: inst.length, w: inst.width, rotated: false }];
    if (inst.rotationAllowed) orientations.push({ l: inst.width, w: inst.length, rotated: true });

    let bestBoard: OpenBoard | null = null;
    let bestRect: FreeRect | null = null;
    let bestOrientation: { l: number; w: number; rotated: boolean } | null = null;
    let bestScore = Infinity;

    for (const ob of openBoards) {
      for (const fr of ob.freeRects) {
        for (const o of orientations) {
          const neededW = o.l + settings.kerfMm;
          const neededH = o.w + settings.kerfMm;
          if (neededW > fr.w || neededH > fr.h) continue;
          const shortSideFit = Math.min(fr.w - neededW, fr.h - neededH);
          if (shortSideFit < bestScore) {
            bestScore = shortSideFit;
            bestBoard = ob;
            bestRect = fr;
            bestOrientation = o;
          }
        }
      }
    }

    if (bestBoard && bestRect && bestOrientation) {
      bestBoard.placements.push(mkPlacement(inst, bestRect.x, bestRect.y, bestOrientation));
      const footprint: FreeRect = { x: bestRect.x, y: bestRect.y, w: bestOrientation.l + settings.kerfMm, h: bestOrientation.w + settings.kerfMm };
      bestBoard.freeRects = pruneFreeRects(bestBoard.freeRects.flatMap((fr) => splitFreeRect(fr, footprint)));
      continue;
    }

    // Nothing already open has room — open a fresh board of whichever spec has supply and fits.
    let opened = false;
    for (const spec of boardSpecs) {
      if ((supply.get(spec.id) ?? 0) <= 0) continue;
      const usableL = spec.length - 2 * settings.edgeMarginMm;
      const usableW = spec.width - 2 * settings.edgeMarginMm;
      const fitting = orientations.find((o) => o.l + settings.kerfMm <= usableL && o.w + settings.kerfMm <= usableW);
      if (!fitting) continue;

      supply.set(spec.id, (supply.get(spec.id) ?? 0) - 1);
      counter.n++;
      const ob: OpenBoard = { boardInstanceId: `BRD-${String(counter.n).padStart(2, '0')}`, spec, freeRects: [{ x: 0, y: 0, w: usableL, h: usableW }], placements: [] };
      ob.placements.push(mkPlacement(inst, 0, 0, fitting));
      const footprint: FreeRect = { x: 0, y: 0, w: fitting.l + settings.kerfMm, h: fitting.w + settings.kerfMm };
      ob.freeRects = pruneFreeRects(splitFreeRect(ob.freeRects[0], footprint));
      openBoards.push(ob);
      opened = true;
      break;
    }

    if (!opened) {
      const reason = boardSpecs.every((s) => (supply.get(s.id) ?? 0) <= 0) ? 'Out of board stock for this material/thickness' : 'Does not fit on any available board size, even alone';
      const reasonAr = boardSpecs.every((s) => (supply.get(s.id) ?? 0) <= 0) ? 'الألواح المتاحة لهذه الخامة والسمك خلصت' : 'القطعة لا تتحط في أي لوح متاح حتى لوحدها';
      unplaced.push(unplacedEntry(inst, reason, reasonAr));
    }
  }

  const boards: BoardInstance[] = openBoards.map((ob) => {
    const usedAreaMm2 = ob.placements.reduce((s, p) => s + p.length * p.width, 0);
    const totalAreaMm2 = boardArea(ob);
    return {
      boardInstanceId: ob.boardInstanceId,
      boardId: ob.spec.id,
      materialId: ob.spec.materialId,
      length: ob.spec.length,
      width: ob.spec.width,
      thicknessMm: ob.spec.thicknessMm,
      placements: ob.placements,
      usedAreaMm2,
      wasteAreaMm2: totalAreaMm2 - usedAreaMm2,
      efficiencyPct: totalAreaMm2 > 0 ? (usedAreaMm2 / totalAreaMm2) * 100 : 0,
    };
  });

  return { boards, unplaced };
}

/**
 * Groups instances by (material, thickness) — never mixes an 18mm and 9mm panel on the
 * same virtual stack — then bin-packs each group onto fresh boards until everything is
 * placed or flagged unplaced. Kerf is spacing between parts, never subtracted from a part's
 * own size. Parts from different furniture items in the same material/thickness group are
 * packed together on the same boards whenever the leftover space allows it.
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
