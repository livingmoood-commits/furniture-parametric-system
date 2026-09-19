import type { BedSpec, Material } from '../../models';
import { NumberField, SelectField } from './fields';

interface Props {
  spec: BedSpec;
  materials: Material[];
  onChange: (spec: BedSpec) => void;
}

export function BedFields({ spec, materials, onChange }: Props) {
  const set = <K extends keyof BedSpec>(key: K, value: BedSpec[K]) => onChange({ ...spec, [key]: value });

  return (
    <div className="field-grid">
      <NumberField label="عرض المرتبة (مم)" value={spec.mattress.width} onChange={(v) => set('mattress', { ...spec.mattress, width: v })} />
      <NumberField label="طول المرتبة (مم)" value={spec.mattress.length} onChange={(v) => set('mattress', { ...spec.mattress, length: v })} />
      <NumberField label="سمك المرتبة (مم)" value={spec.mattress.thicknessMm} onChange={(v) => set('mattress', { ...spec.mattress, thicknessMm: v })} />
      <NumberField label="سمك جوانب الهيكل (مم)" value={spec.sideThicknessMm} onChange={(v) => set('sideThicknessMm', v)} />
      <NumberField label="سمك الفريم (مم)" value={spec.frameThicknessMm} onChange={(v) => set('frameThicknessMm', v)} />
      <NumberField label="ارتفاع القاعدة (مم)" value={spec.baseHeightMm} onChange={(v) => set('baseHeightMm', v)} />
      <NumberField label="ارتفاع الظهر (مم)" value={spec.backHeightMm} onChange={(v) => set('backHeightMm', v)} />
      <NumberField label="فراغ الميكانيزم الهيدروليكي (مم)" value={spec.mechanismClearanceMm} onChange={(v) => set('mechanismClearanceMm', v)} />
      <SelectField
        label="خامة الهيكل"
        value={spec.materialId}
        options={materials.map((m) => ({ value: m.id, label: m.nameAr }))}
        onChange={(v) => set('materialId', v)}
      />
      <SelectField
        label="خامة الظهر"
        value={spec.backMaterial}
        options={[
          { value: 'wood', label: 'خشب' },
          { value: 'upholstered', label: 'منجد' },
          { value: 'rattan', label: 'راتان' },
        ]}
        onChange={(v) => set('backMaterial', v)}
      />
    </div>
  );
}
