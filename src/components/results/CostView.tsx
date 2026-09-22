import type { CostSummary } from '../../engine/costEngine';
import type { Material, PriceListItem } from '../../models';
import { NumberField, TextField } from '../forms/fields';

interface Props {
  cost: CostSummary;
  materials: Material[];
  priceList: PriceListItem[];
  onPriceListChange: (priceList: PriceListItem[]) => void;
}

let seq = 6000;
const nextId = () => `PRICE-${seq++}`;

/** Every board-cost number comes straight from computeBoardCost(derived.nesting, project.boards)
 * — never re-derived here. The price list below it is genuinely free-form user data (hardware,
 * labor, delivery, anything the app has no real pricing for) and is never mixed into the
 * board-cost figures; the two totals are always shown, and summed, separately and clearly. */
export function CostView({ cost, materials, priceList, onPriceListChange }: Props) {
  const materialName = (id: string) => materials.find((m) => m.id === id)?.nameAr ?? id;

  const priceListTotal = priceList.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const grandTotal = cost.totalKnown + priceListTotal;

  const addItem = () => {
    const item: PriceListItem = { id: nextId(), name: 'بند جديد', quantity: 1, unitPrice: 0, unit: 'قطعة' };
    onPriceListChange([...priceList, item]);
  };
  const updateItem = (id: string, patch: Partial<PriceListItem>) => onPriceListChange(priceList.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const removeItem = (id: string) => onPriceListChange(priceList.filter((it) => it.id !== id));

  return (
    <>
      <h4>تكلفة الألواح (من التقطيع تلقائيًا)</h4>
      {cost.hasUnknownPricing && (
        <p className="warn cost-warning">
          ⚠ فيه {cost.unknownBoardIds.length} نوع لوح متستخدم بالفعل في التقطيع بدون سعر مسجل — الإجمالي تحت ده <strong>ناقص</strong>، مش تكلفة كاملة. سجّل السعر في "الخامات والألواح" عشان يكتمل الحساب.
        </p>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>الخامة</th>
            <th>عدد الألواح المستخدمة</th>
            <th>السعر / لوح</th>
            <th>الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {cost.lines.map((line) => (
            <tr key={line.boardId} className={line.subtotal === undefined ? 'flagged-row' : undefined}>
              <td>{materialName(line.materialId)}</td>
              <td>{line.boardsUsed}</td>
              <td>{line.pricePerBoard !== undefined ? line.pricePerBoard.toLocaleString('ar-EG') : 'غير محدد'}</td>
              <td>{line.subtotal !== undefined ? line.subtotal.toLocaleString('ar-EG') : '—'}</td>
            </tr>
          ))}
          {cost.lines.length === 0 && (
            <tr>
              <td colSpan={4} className="empty-row">
                مفيش ألواح متستخدمة لسه.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <h4>قائمة الأسعار (يدوية — أوكسسوارات، هارد وير، عمالة، أي حاجة تانية)</h4>
      <p className="hint">ضيف أي بند وعدّل السعر والكمية بحرية — البنود دي مش مشتقة من التصميم، إنت اللي بتتحكم فيها بالكامل.</p>

      <div className="sub-list">
        {priceList.map((item) => (
          <div className="sub-item price-item" key={item.id}>
            <div className="field-grid price-item-grid">
              <TextField label="الاسم" value={item.name} onChange={(v) => updateItem(item.id, { name: v })} />
              <NumberField label="الكمية" value={item.quantity} min={0} onChange={(v) => updateItem(item.id, { quantity: v })} />
              <TextField label="الوحدة" value={item.unit} onChange={(v) => updateItem(item.id, { unit: v })} />
              <NumberField label="سعر الوحدة" value={item.unitPrice} min={0} onChange={(v) => updateItem(item.id, { unitPrice: v })} />
              <div className="price-item-subtotal">
                <span className="hint">الإجمالي</span>
                <strong>{(item.quantity * item.unitPrice).toLocaleString('ar-EG')}</strong>
              </div>
            </div>
            <button type="button" className="danger" onClick={() => removeItem(item.id)}>
              حذف البند
            </button>
          </div>
        ))}
        {priceList.length === 0 && <p className="empty-row">مفيش بنود لسه — دوس "إضافة بند" وابدأ تسجّل أي تكلفة تانية.</p>}
        <button type="button" onClick={addItem}>
          + إضافة بند
        </button>
      </div>

      <div className="summary-grid cost-totals-grid">
        <div className="summary-card">
          <h4>تكلفة الألواح</h4>
          <p className="cost-total-figure">{cost.totalKnown.toLocaleString('ar-EG')}</p>
          {cost.hasUnknownPricing && <p className="warn">غير مكتملة</p>}
        </div>
        <div className="summary-card">
          <h4>قائمة الأسعار</h4>
          <p className="cost-total-figure">{priceListTotal.toLocaleString('ar-EG')}</p>
        </div>
        <div className="summary-card cost-total-card">
          <h4>الإجمالي الكلي</h4>
          <p className="cost-total-figure">{grandTotal.toLocaleString('ar-EG')}</p>
          {cost.hasUnknownPricing && <p className="hint">ناقص تكلفة الألواح اللي بدون سعر</p>}
        </div>
      </div>
    </>
  );
}
