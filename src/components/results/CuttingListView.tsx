import type { DisplayUnit, Material, Part } from '../../models';
import { formatLength } from '../../engine/units';

interface Props {
  parts: Part[];
  materials: Material[];
  displayUnit: DisplayUnit;
}

export function CuttingListView({ parts, materials, displayUnit }: Props) {
  const materialName = (id: string) => materials.find((m) => m.id === id)?.nameAr ?? id;

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>#</th>
          <th>الاسم</th>
          <th>الكمية</th>
          <th>الطول</th>
          <th>العرض</th>
          <th>السمك (مم)</th>
          <th>الخامة</th>
          <th>اتجاه العرق</th>
          <th>Edge Banding</th>
          <th>ملاحظات</th>
        </tr>
      </thead>
      <tbody>
        {parts.map((p) => (
          <tr key={p.id} className={p.sourceFlag ? 'flagged-row' : undefined}>
            <td>{p.id}</td>
            <td>{p.nameAr ?? p.name}</td>
            <td>{p.quantity}</td>
            <td>{formatLength(p.dimensions.length, displayUnit)}</td>
            <td>{formatLength(p.dimensions.width, displayUnit)}</td>
            <td>{p.dimensions.thicknessMm}</td>
            <td>{materialName(p.materialId)}</td>
            <td>{p.grainDirection === 'none' ? '—' : p.grainDirection === 'length' ? 'مع الطول' : 'مع العرض'}</td>
            <td>{[p.edgeBanding.top && 'أعلى', p.edgeBanding.bottom && 'أسفل', p.edgeBanding.left && 'يسار', p.edgeBanding.right && 'يمين'].filter(Boolean).join('، ') || '—'}</td>
            <td>{p.sourceFlag ?? (p.splitInfo ? `جزء ${p.splitInfo.index}/${p.splitInfo.of}` : '')}</td>
          </tr>
        ))}
        {parts.length === 0 && (
          <tr>
            <td colSpan={10} className="empty-row">
              مفيش قطع لسه — فعّل السرير أو الكومودينو أو ضيف قطعة حرة.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
