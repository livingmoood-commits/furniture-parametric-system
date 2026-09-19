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

  if (project.bed.enabled) {
    items.push({
      id: 'qc-mattress',
      label: `Mattress size ${project.bed.mattress.width}×${project.bed.mattress.length}mm confirmed`,
      labelAr: `مقاس المرتبة ${project.bed.mattress.width}×${project.bed.mattress.length}مم مؤكد`,
      passed: project.bed.mattress.width > 0 && project.bed.mattress.length > 0,
    });
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
