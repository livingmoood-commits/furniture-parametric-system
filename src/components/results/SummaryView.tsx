import type { DerivedProject } from '../../engine/derive';
import type { Project } from '../../models';
import { formatLength } from '../../engine/units';

export function SummaryView({ project, derived }: { project: Project; derived: DerivedProject }) {
  const totalInstances = derived.parts.reduce((s, p) => s + p.quantity, 0);

  return (
    <div className="summary-grid">
      {project.bed.enabled && derived.bedGeometry && (
        <div className="summary-card">
          <h4>السرير</h4>
          <p>
            المقاس الخارجي: {formatLength(derived.bedGeometry.outerWidth, project.displayUnit)} ×{' '}
            {formatLength(derived.bedGeometry.outerLength, project.displayUnit)}
          </p>
          <p>ارتفاع سطح المرتبة النهائي: {formatLength(derived.bedGeometry.finalMattressHeight, project.displayUnit)}</p>
          <p>لوح الرفع: {derived.bedGeometry.liftPlatform.count === 2 ? 'مقسّم لنصين تلقائيًا' : 'قطعة واحدة'}</p>
        </div>
      )}

      {project.nightstand.enabled && (
        <div className="summary-card">
          <h4>الكومودينو × {project.nightstand.quantity}</h4>
          <p>
            {formatLength(project.nightstand.width, project.displayUnit)} × {formatLength(project.nightstand.depth, project.displayUnit)} ×{' '}
            {formatLength(project.nightstand.height, project.displayUnit)}
          </p>
          <p>{project.nightstand.drawerCount} درج لكل وحدة</p>
        </div>
      )}

      {project.freeFurniture.length > 0 && (
        <div className="summary-card">
          <h4>قطع حرة</h4>
          <p>
            {project.freeFurniture.length} عنصر — {project.freeFurniture.reduce((s, i) => s + i.parts.length, 0)} جزء
          </p>
        </div>
      )}

      <div className="summary-card">
        <h4>ملخص التصنيع</h4>
        <p>
          {derived.parts.length} نوع قطعة — {totalInstances} قطعة إجمالي
        </p>
        <p>
          {derived.nesting.totalBoardsUsed} لوح مطلوب — كفاءة {derived.nesting.overallEfficiencyPct.toFixed(1)}%
        </p>
        {derived.nesting.unplacedParts.length > 0 && <p className="warn">{derived.nesting.unplacedParts.length} قطعة لم تُوزع — راجع تبويب الفحص النهائي</p>}
      </div>
    </div>
  );
}
