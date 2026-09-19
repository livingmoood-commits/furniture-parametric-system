import type { FreeFurnitureCategory, FreeFurnitureItem, FreePart, GrainDirection, Material } from '../../models';
import { defaultEdgeBanding } from '../../models';
import { NumberField, SelectField, TextField } from './fields';
import { FreePartsIcon } from '../icons';

interface Props {
  items: FreeFurnitureItem[];
  materials: Material[];
  onChange: (items: FreeFurnitureItem[]) => void;
}

const CATEGORY_OPTIONS: Array<{ value: FreeFurnitureCategory; label: string }> = [
  { value: 'wardrobe', label: 'دولاب' },
  { value: 'dressing-table', label: 'دريسينج' },
  { value: 'dining-table', label: 'ترابيزة سفرة' },
  { value: 'kitchen-unit', label: 'وحدة مطبخ' },
  { value: 'other', label: 'حاجة تانية' },
];

const GRAIN_OPTIONS: Array<{ value: GrainDirection; label: string }> = [
  { value: 'length', label: 'مع الطول' },
  { value: 'width', label: 'مع العرض' },
  { value: 'none', label: 'بدون اتجاه' },
];

let seq = 2000;
const nextId = (prefix: string) => `${prefix}-${seq++}`;

export function FreeFurnitureForm({ items, materials, onChange }: Props) {
  const addItem = () => {
    const id = nextId('FREE');
    onChange([...items, { id, name: 'قطعة أثاث جديدة', category: 'other', parts: [] }]);
  };

  const updateItem = (id: string, patch: Partial<FreeFurnitureItem>) => onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const removeItem = (id: string) => onChange(items.filter((it) => it.id !== id));

  const addPart = (itemId: string) => {
    const item = items.find((it) => it.id === itemId);
    if (!item) return;
    const part: FreePart = {
      id: nextId('FP'),
      name: 'قطعة جديدة',
      length: 600,
      width: 400,
      thicknessMm: 18,
      quantity: 1,
      materialId: materials[0]?.id ?? '',
      grainDirection: 'none',
      edgeBanding: defaultEdgeBanding(),
    };
    updateItem(itemId, { parts: [...item.parts, part] });
  };

  const updatePart = (itemId: string, partId: string, patch: Partial<FreePart>) => {
    const item = items.find((it) => it.id === itemId);
    if (!item) return;
    updateItem(itemId, { parts: item.parts.map((p) => (p.id === partId ? { ...p, ...patch } : p)) });
  };

  const removePart = (itemId: string, partId: string) => {
    const item = items.find((it) => it.id === itemId);
    if (!item) return;
    updateItem(itemId, { parts: item.parts.filter((p) => p.id !== partId) });
  };

  return (
    <fieldset className="panel">
      <legend>
        <FreePartsIcon /> وضع القطع الحرة (Free Parts mode)
      </legend>
      <p className="hint">اختار نوع الأثاث وادخل أبعاد كل قطعة يدويًا — بتمر بنفس خط الإنتاج (قائمة تقطيع ← تقطيع على اللوح ← فحص).</p>

      {items.map((item) => (
        <div className="sub-item" key={item.id}>
          <div className="field-grid">
            <TextField label="اسم القطعة" value={item.name} onChange={(v) => updateItem(item.id, { name: v })} />
            <SelectField label="النوع" value={item.category} options={CATEGORY_OPTIONS} onChange={(v) => updateItem(item.id, { category: v })} />
          </div>
          <button type="button" className="danger" onClick={() => removeItem(item.id)}>
            حذف القطعة كلها
          </button>

          <div className="sub-list">
            <h4>أجزاء القطعة (Parts)</h4>
            {item.parts.map((p) => (
              <div className="sub-item" key={p.id}>
                <div className="field-grid">
                  <TextField label="الاسم" value={p.name} onChange={(v) => updatePart(item.id, p.id, { name: v })} />
                  <NumberField label="الطول (مم)" value={p.length} onChange={(v) => updatePart(item.id, p.id, { length: v })} />
                  <NumberField label="العرض (مم)" value={p.width} onChange={(v) => updatePart(item.id, p.id, { width: v })} />
                  <NumberField label="السمك (مم)" value={p.thicknessMm} onChange={(v) => updatePart(item.id, p.id, { thicknessMm: v })} />
                  <NumberField label="الكمية" value={p.quantity} min={1} onChange={(v) => updatePart(item.id, p.id, { quantity: Math.max(1, v) })} />
                  <SelectField
                    label="الخامة"
                    value={p.materialId}
                    options={materials.map((m) => ({ value: m.id, label: m.nameAr }))}
                    onChange={(v) => updatePart(item.id, p.id, { materialId: v })}
                  />
                  <SelectField label="اتجاه العرق" value={p.grainDirection} options={GRAIN_OPTIONS} onChange={(v) => updatePart(item.id, p.id, { grainDirection: v })} />
                </div>
                <button type="button" className="danger" onClick={() => removePart(item.id, p.id)}>
                  حذف الجزء
                </button>
              </div>
            ))}
            <button type="button" onClick={() => addPart(item.id)}>
              + إضافة جزء
            </button>
          </div>
        </div>
      ))}

      <button type="button" onClick={addItem}>
        + إضافة قطعة أثاث حرة
      </button>
    </fieldset>
  );
}
