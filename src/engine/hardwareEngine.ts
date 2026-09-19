import type { HardwareItem, JoinType, Part, Project } from '../models';

const FASTENER_LABELS: Partial<Record<JoinType, { name: string; nameAr: string }>> = {
  screw: { name: 'Wood screws', nameAr: 'مسامير خشب' },
  'cam-lock': { name: 'Cam locks + dowels', nameAr: 'كامات تثبيت + بنات' },
  dowel: { name: 'Dowel pins', nameAr: 'بنات (دبل)' },
  bracket: { name: 'Metal corner brackets', nameAr: 'زوايا معدنية' },
};

/**
 * Hardware/accessories are always computed from part & joint counts, never typed in by hand.
 * Fastener totals in particular come straight from each Part's own `assembly[]` field.
 */
export function computeHardware(project: Project, parts: Part[]): HardwareItem[] {
  const items: HardwareItem[] = [];

  for (const item of project.furniture) {
    if (item.kind === 'bed') {
      items.push({ id: `HW-${item.id}-MECHANISM`, name: `${item.name} — hydraulic lift mechanism`, nameAr: `${item.name} — ميكانيزم رفع هيدروليكي`, category: 'mechanism', quantity: 1, unit: 'set' });
      items.push({ id: `HW-${item.id}-LEGS`, name: `${item.name} — legs`, nameAr: `${item.name} — أرجل`, category: 'leg', quantity: 6, unit: 'piece' });
      items.push({ id: `HW-${item.id}-RUBBER-STRIP`, name: `${item.name} — rubber bumper strip`, nameAr: `${item.name} — شريط مطاطي`, category: 'trim', quantity: 1, unit: 'set' });
    } else if (item.kind === 'nightstand') {
      const drawerTotal = item.spec.drawerCount * item.spec.quantity;
      if (drawerTotal > 0) {
        items.push({ id: `HW-${item.id}-RUNNERS`, name: `${item.name} — ball-bearing drawer slides`, nameAr: `${item.name} — سكك أدراج`, category: 'runner', quantity: drawerTotal, unit: 'pair' });
        items.push({ id: `HW-${item.id}-HANDLES`, name: `${item.name} — drawer handles`, nameAr: `${item.name} — مقابض الأدراج`, category: 'other', quantity: drawerTotal, unit: 'piece' });
      }
      items.push({ id: `HW-${item.id}-LEGS`, name: `${item.name} — legs`, nameAr: `${item.name} — أرجل`, category: 'leg', quantity: item.spec.quantity * 4, unit: 'piece' });
    }
  }

  const fastenerCounts = new Map<JoinType, number>();
  for (const part of parts) {
    for (const joint of part.assembly) {
      if (joint.joinType in FASTENER_LABELS) {
        fastenerCounts.set(joint.joinType, (fastenerCounts.get(joint.joinType) ?? 0) + (joint.fastenerCount ?? 1) * part.quantity);
      }
    }
  }
  for (const [type, qty] of fastenerCounts) {
    const label = FASTENER_LABELS[type]!;
    items.push({ id: `HW-FASTENER-${type.toUpperCase()}`, name: label.name, nameAr: label.nameAr, category: type === 'bracket' ? 'bracket' : 'fastener', quantity: qty, unit: 'piece' });
  }

  return items;
}

export interface EdgeBandingSummary {
  materialId: string;
  totalLengthMm: number;
}

/** Aggregates banded-edge length per material — the Phase-1 gap the spec flagged as "not rolled up yet". */
export function computeEdgeBandingSummary(parts: Part[]): EdgeBandingSummary[] {
  const totals = new Map<string, number>();
  for (const part of parts) {
    const { length, width } = part.dimensions;
    const eb = part.edgeBanding;
    let perPiece = 0;
    if (eb.top) perPiece += length;
    if (eb.bottom) perPiece += length;
    if (eb.left) perPiece += width;
    if (eb.right) perPiece += width;
    if (perPiece === 0) continue;
    totals.set(part.materialId, (totals.get(part.materialId) ?? 0) + perPiece * part.quantity);
  }
  return Array.from(totals.entries()).map(([materialId, totalLengthMm]) => ({ materialId, totalLengthMm }));
}
