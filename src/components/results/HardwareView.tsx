import type { EdgeBandingSummary } from '../../engine/hardwareEngine';
import type { HardwareItem, Material } from '../../models';

interface Props {
  items: HardwareItem[];
  edgeBanding: EdgeBandingSummary[];
  materials: Material[];
}

export function HardwareView({ items, edgeBanding, materials }: Props) {
  const materialName = (id: string) => materials.find((m) => m.id === id)?.nameAr ?? id;

  return (
    <>
      <table className="data-table">
        <thead>
          <tr>
            <th>الصنف</th>
            <th>الفئة</th>
            <th>الكمية</th>
            <th>الوحدة</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id}>
              <td>{i.nameAr ?? i.name}</td>
              <td>{i.category}</td>
              <td>{i.quantity}</td>
              <td>{i.unit}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={4} className="empty-row">
                مفيش أوكسسوارات لسه.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {edgeBanding.length > 0 && (
        <>
          <h4>إجمالي شريط الحرف (Edge Banding)</h4>
          <table className="data-table">
            <thead>
              <tr>
                <th>الخامة</th>
                <th>الطول الإجمالي (متر)</th>
              </tr>
            </thead>
            <tbody>
              {edgeBanding.map((e) => (
                <tr key={e.materialId}>
                  <td>{materialName(e.materialId)}</td>
                  <td>{(e.totalLengthMm / 1000).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}
