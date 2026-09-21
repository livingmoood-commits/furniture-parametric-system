import type { DisplayUnit, Material, NightstandSpec } from '../../models';
import { LengthField, NumberField, SelectField } from './fields';

interface Props {
  spec: NightstandSpec;
  materials: Material[];
  displayUnit: DisplayUnit;
  onChange: (spec: NightstandSpec) => void;
}

export function NightstandFields({ spec, materials, displayUnit, onChange }: Props) {
  const set = <K extends keyof NightstandSpec>(key: K, value: NightstandSpec[K]) => onChange({ ...spec, [key]: value });
  const u = displayUnit;

  return (
    <div className="field-grid">
      <NumberField label="العدد" value={spec.quantity} min={1} onChange={(v) => set('quantity', Math.max(1, v))} />
      <LengthField label="العرض" unit={u} valueMm={spec.width} onChangeMm={(v) => set('width', v)} />
      <LengthField label="العمق" unit={u} valueMm={spec.depth} onChangeMm={(v) => set('depth', v)} />
      <LengthField label="الارتفاع" unit={u} valueMm={spec.height} onChangeMm={(v) => set('height', v)} />
      <LengthField label="سمك الجوانب" unit={u} valueMm={spec.sideThicknessMm} onChangeMm={(v) => set('sideThicknessMm', v)} />
      <NumberField label="عدد الأدراج" value={spec.drawerCount} min={0} onChange={(v) => set('drawerCount', Math.max(0, v))} />
      <LengthField label="فراغ واجهة الدرج" unit={u} valueMm={spec.drawerFrontGapMm} onChangeMm={(v) => set('drawerFrontGapMm', v)} />
      <LengthField label="فراغ سكة الدرج" unit={u} valueMm={spec.slideRunnerClearanceMm} onChangeMm={(v) => set('slideRunnerClearanceMm', v)} />
      <SelectField
        label="خامة الهيكل"
        value={spec.materialId}
        options={materials.map((m) => ({ value: m.id, label: m.nameAr }))}
        onChange={(v) => set('materialId', v)}
      />
      <SelectField
        label="خامة الظهر وقواعد الأدراج (رقيقة)"
        value={spec.thinMaterialId}
        options={materials.map((m) => ({ value: m.id, label: m.nameAr }))}
        onChange={(v) => set('thinMaterialId', v)}
      />
    </div>
  );
}
