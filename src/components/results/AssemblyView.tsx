import type { AssemblyInstruction } from '../../engine/assemblyEngine';
import type { JoinType } from '../../models';

const JOIN_LABELS: Record<JoinType, string> = {
  screw: 'مسامير',
  'cam-lock': 'كامة تثبيت',
  dowel: 'بنة (دبل)',
  glue: 'غراء',
  hinge: 'مفصلة',
  bracket: 'زاوية معدنية',
  'slide-runner': 'سكة درج',
};

export function AssemblyView({ instructions }: { instructions: AssemblyInstruction[] }) {
  if (instructions.length === 0) {
    return <p className="empty-row">مفيش تعليمات تجميع لسه.</p>;
  }
  return (
    <ol className="assembly-list">
      {instructions.map((ins, i) => (
        <li key={`${ins.partId}-${ins.toPartId}-${i}`}>
          <strong>{ins.partName}</strong> تتثبت في <strong>{ins.toPartName}</strong> — {JOIN_LABELS[ins.joinType]}
          {ins.fastenerCount ? ` × ${ins.fastenerCount}` : ''}
          {ins.note ? ` (${ins.note})` : ''}
        </li>
      ))}
    </ol>
  );
}
