import type { DerivedProject } from '../../engine/derive';
import type { Project } from '../../models';
import { formatLength } from '../../engine/units';

export function SummaryView({ project, derived }: { project: Project; derived: DerivedProject }) {
  const totalInstances = derived.parts.reduce((s, p) => s + p.quantity, 0);

  return (
    <div className="summary-grid">
      {project.furniture.map((item) => {
        if (item.kind === 'bed') {
          const entry = derived.bedGeometries.find((g) => g.itemId === item.id);
          if (!entry) return null;
          return (
            <div className="summary-card" key={item.id}>
              <h4>{item.name}</h4>
              <p>
                المقاس الخارجي: {formatLength(entry.geometry.outerWidth, project.displayUnit)} ×{' '}
                {formatLength(entry.geometry.outerLength, project.displayUnit)}
              </p>
              <p>ارتفاع سطح المرتبة النهائي: {formatLength(entry.geometry.finalMattressHeight, project.displayUnit)}</p>
              <p>لوح الرفع: {entry.geometry.liftPlatform.count === 2 ? 'مقسّم لنصين تلقائيًا' : 'قطعة واحدة'}</p>
            </div>
          );
        }
        if (item.kind === 'nightstand') {
          return (
            <div className="summary-card" key={item.id}>
              <h4>
                {item.name} × {item.spec.quantity}
              </h4>
              <p>
                {formatLength(item.spec.width, project.displayUnit)} × {formatLength(item.spec.depth, project.displayUnit)} × {formatLength(item.spec.height, project.displayUnit)}
              </p>
              <p>{item.spec.drawerCount} درج لكل وحدة</p>
            </div>
          );
        }
        return (
          <div className="summary-card" key={item.id}>
            <h4>{item.name}</h4>
            <p>{item.parts.length} جزء</p>
          </div>
        );
      })}

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
