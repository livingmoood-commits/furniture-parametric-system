import type { FreeFurnitureItem, FreePart, GrainDirection, Material } from '../../models';
import { defaultEdgeBanding } from '../../models';
import { NumberField, SelectField, TextField } from './fields';

interface Props {
  item: FreeFurnitureItem;
  materials: Material[];
  onChange: (patch: Partial<FreeFurnitureItem>) => void;
}

const GRAIN_OPTIONS: Array<{ value: GrainDirection; label: string }> = [
  { value: 'length', label: 'مع الطول' },
  { value: 'width', label: 'مع العرض' },
  { value: 'none', label: 'بدون اتجاه' },
];

let seq = 4000;
const nextId = () => `FP-${seq++}`;

export function FreePartsFields({ item, materials, onChange }: Props) {
  const addPart = () => {
    const part: FreePart = {
      id: nextId(),
      name: 'قطعة جديدة',
      length: 600,
      width: 400,
      thicknessMm: 18,
      quantity: 1,
      materialId: materials[0]?.id ?? '',
      grainDirection: 'none',
      edgeBanding: defaultEdgeBanding(),
    };
    onChange({ parts: [...item.parts, part] });
  };

  const updatePart = (partId: string, patch: Partial<FreePart>) => onChange({ parts: item.parts.map((p) => (p.id === partId ? { ...p, ...patch } : p)) });
  const removePart = (partId: string) => onChange({ parts: item.parts.filter((p) => p.id !== partId) });

  return (
    <div className="sub-list">
      <p className="hint">أدخل أبعاد كل جزء يدويًا — مفيش قواعد بارامترية هنا، بس بتمر بنفس خط الإنتاج.</p>
      {item.parts.map((p) => (
        <div className="sub-item" key={p.id}>
          <div className="field-grid">
            <TextField label="الاسم" value={p.name} onChange={(v) => updatePart(p.id, { name: v })} />
            <NumberField label="الطول (مم)" value={p.length} onChange={(v) => updatePart(p.id, { length: v })} />
            <NumberField label="العرض (مم)" value={p.width} onChange={(v) => updatePart(p.id, { width: v })} />
            <NumberField label="السمك (مم)" value={p.thicknessMm} onChange={(v) => updatePart(p.id, { thicknessMm: v })} />
            <NumberField label="الكمية" value={p.quantity} min={1} onChange={(v) => updatePart(p.id, { quantity: Math.max(1, v) })} />
            <SelectField
              label="الخامة"
              value={p.materialId}
              options={materials.map((m) => ({ value: m.id, label: m.nameAr }))}
              onChange={(v) => updatePart(p.id, { materialId: v })}
            />
            <SelectField label="اتجاه العرق" value={p.grainDirection} options={GRAIN_OPTIONS} onChange={(v) => updatePart(p.id, { grainDirection: v })} />
          </div>
          <button type="button" className="danger" onClick={() => removePart(p.id)}>
            حذف الجزء
          </button>
        </div>
      ))}
      <button type="button" onClick={addPart}>
        + إضافة جزء
      </button>
    </div>
  );
}
