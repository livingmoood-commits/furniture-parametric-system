import type { QCItem } from '../../engine/qcEngine';
import type { UnplacedPart } from '../../models';

interface Props {
  items: QCItem[];
  unplaced: UnplacedPart[];
}

export function QCView({ items, unplaced }: Props) {
  return (
    <>
      <ul className="qc-list">
        {items.map((i) => (
          <li key={i.id} className={i.passed ? 'qc-pass' : 'qc-fail'}>
            <span className="qc-icon">{i.passed ? '✓' : '⚠'}</span> {i.labelAr}
          </li>
        ))}
      </ul>
      {unplaced.length > 0 && (
        <>
          <h4>قطع لم توزع على الألواح</h4>
          <ul className="qc-list">
            {unplaced.map((u, i) => (
              <li key={`${u.partId}-${i}`} className="qc-fail">
                <span className="qc-icon">⚠</span> {u.partId} — {u.reasonAr}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
