import type { Material, NightstandSpec } from '../../models';
import { NumberField, SelectField } from './fields';

interface Props {
  spec: NightstandSpec;
  materials: Material[];
  onChange: (spec: NightstandSpec) => void;
}

export function NightstandFields({ spec, materials, onChange }: Props) {
  const set = <K extends keyof NightstandSpec>(key: K, value: NightstandSpec[K]) => onChange({ ...spec, [key]: value });

  return (
    <div className="field-grid">
      <NumberField label="العدد" value={spec.quantity} min={1} onChange={(v) => set('quantity', Math.max(1, v))} />
      <NumberField label="العرض (مم)" value={spec.width} onChange={(v) => set('width', v)} />
      <NumberField label="العمق (مم)" value={spec.depth} onChange={(v) => set('depth', v)} />
      <NumberField label="الارتفاع (مم)" value={spec.height} onChange={(v) => set('height', v)} />
      <NumberField label="سمك الجوانب (مم)" value={spec.sideThicknessMm} onChange={(v) => set('sideThicknessMm', v)} />
      <NumberField label="عدد الأدراج" value={spec.drawerCount} min={0} onChange={(v) => set('drawerCount', Math.max(0, v))} />
      <NumberField label="فراغ واجهة الدرج (مم)" value={spec.drawerFrontGapMm} onChange={(v) => set('drawerFrontGapMm', v)} />
      <NumberField label="فراغ سكة الدرج (مم)" value={spec.slideRunnerClearanceMm} onChange={(v) => set('slideRunnerClearanceMm', v)} />
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
