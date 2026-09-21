import type { BedSpec, DisplayUnit, Material } from '../../models';
import { LengthField, SelectField } from './fields';

interface Props {
  spec: BedSpec;
  materials: Material[];
  displayUnit: DisplayUnit;
  onChange: (spec: BedSpec) => void;
}

export function BedFields({ spec, materials, displayUnit, onChange }: Props) {
  const set = <K extends keyof BedSpec>(key: K, value: BedSpec[K]) => onChange({ ...spec, [key]: value });
  const u = displayUnit;

  return (
    <div className="field-grid">
      <LengthField label="عرض المرتبة" unit={u} valueMm={spec.mattress.width} onChangeMm={(v) => set('mattress', { ...spec.mattress, width: v })} />
      <LengthField label="طول المرتبة" unit={u} valueMm={spec.mattress.length} onChangeMm={(v) => set('mattress', { ...spec.mattress, length: v })} />
      <LengthField label="سمك المرتبة" unit={u} valueMm={spec.mattress.thicknessMm} onChangeMm={(v) => set('mattress', { ...spec.mattress, thicknessMm: v })} />
      <LengthField label="سمك جوانب الهيكل" unit={u} valueMm={spec.sideThicknessMm} onChangeMm={(v) => set('sideThicknessMm', v)} />
      <LengthField label="سمك الفريم" unit={u} valueMm={spec.frameThicknessMm} onChangeMm={(v) => set('frameThicknessMm', v)} />
      <LengthField label="ارتفاع القاعدة" unit={u} valueMm={spec.baseHeightMm} onChangeMm={(v) => set('baseHeightMm', v)} />
      <LengthField label="ارتفاع الظهر" unit={u} valueMm={spec.backHeightMm} onChangeMm={(v) => set('backHeightMm', v)} />
      <LengthField label="فراغ الميكانيزم الهيدروليكي" unit={u} valueMm={spec.mechanismClearanceMm} onChangeMm={(v) => set('mechanismClearanceMm', v)} />
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
      <SelectField
        label="قاعدة الفرش"
        value={spec.mattressBaseType}
        options={[
          { value: 'solid', label: 'لوح مصمت (رفع هيدروليكي)' },
          { value: 'slats', label: 'ملل خشبية (تهوية)' },
        ]}
        onChange={(v) => set('mattressBaseType', v)}
      />
      {spec.mattressBaseType === 'slats' && (
        <>
          <LengthField label="عرض الملة" unit={u} valueMm={spec.slatWidthMm} onChangeMm={(v) => set('slatWidthMm', v)} />
          <LengthField label="الفاصل المستهدف بين الملل" unit={u} valueMm={spec.slatGapMm} onChangeMm={(v) => set('slatGapMm', v)} />
          <LengthField label="سمك الملة" unit={u} valueMm={spec.slatThicknessMm} onChangeMm={(v) => set('slatThicknessMm', v)} />
        </>
      )}
    </div>
  );
}
