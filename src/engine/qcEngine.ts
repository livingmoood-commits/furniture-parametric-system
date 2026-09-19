import type { NestingResult, Part, Project } from '../models';

export interface QCItem {
  id: string;
  label: string;
  labelAr: string;
  passed: boolean;
}

/** Every line is derived from live data — never a fixed hand-written checklist. */
export function buildFinalQC(project: Project, parts: Part[], nesting: NestingResult): QCItem[] {
  const items: QCItem[] = [];

  for (const item of project.furniture) {
    if (item.kind === 'bed') {
      items.push({
        id: `qc-mattress-${item.id}`,
        label: `${item.name}: mattress size ${item.spec.mattress.width}×${item.spec.mattress.length}mm confirmed`,
        labelAr: `${item.name}: مقاس المرتبة ${item.spec.mattress.width}×${item.spec.mattress.length}مم مؤكد`,
        passed: item.spec.mattress.width > 0 && item.spec.mattress.length > 0,
      });
    }
  }

  const totalInstances = parts.reduce((s, p) => s + p.quantity, 0);
  items.push({
    id: 'qc-parts-qty',
    label: `${totalInstances} part instances defined across ${parts.length} distinct parts`,
    labelAr: `${totalInstances} قطعة بالكميات عبر ${parts.length} نوع قطعة`,
    passed: totalInstances > 0,
  });

  items.push({
    id: 'qc-boards-qty',
    label: `${nesting.totalBoardsUsed} board(s) required`,
    labelAr: `${nesting.totalBoardsUsed} لوح مطلوب`,
    passed: nesting.totalBoardsUsed > 0,
  });

  items.push({
    id: 'qc-unplaced',
    label: nesting.unplacedParts.length === 0 ? 'All parts placed on boards' : `${nesting.unplacedParts.length} part(s) could not be placed`,
    labelAr: nesting.unplacedParts.length === 0 ? 'كل القطع اتوزعت على الألواح' : `${nesting.unplacedParts.length} قطعة لم توزع`,
    passed: nesting.unplacedParts.length === 0,
  });

  const flagged = parts.filter((p) => p.sourceFlag);
  items.push({
    id: 'qc-flags',
    label: flagged.length === 0 ? 'No unresolved source flags' : `${flagged.length} part(s) carry a source flag — review before production`,
    labelAr: flagged.length === 0 ? 'مفيش نقاط بيانات معلّمة تحتاج مراجعة' : `${flagged.length} قطعة عليها تنبيه مصدر — راجعها قبل التصنيع`,
    passed: flagged.length === 0,
  });

  return items;
}
