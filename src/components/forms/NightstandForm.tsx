import type { Material, NightstandSpec } from '../../models';
import { NumberField, SelectField } from './fields';
import { NightstandIcon } from '../icons';

interface Props {
  nightstand: NightstandSpec;
  materials: Material[];
  onChange: (ns: NightstandSpec) => void;
}

export function NightstandForm({ nightstand, materials, onChange }: Props) {
  const set = <K extends keyof NightstandSpec>(key: K, value: NightstandSpec[K]) => onChange({ ...nightstand, [key]: value });

  return (
    <fieldset className="panel">
      <legend>
        <label className="switch">
          <input type="checkbox" checked={nightstand.enabled} onChange={(e) => set('enabled', e.target.checked)} />
          <NightstandIcon /> الكومودينو (Nightstand)
        </label>
      </legend>
      {nightstand.enabled && (
        <div className="field-grid">
          <NumberField label="العدد" value={nightstand.quantity} min={1} onChange={(v) => set('quantity', Math.max(1, v))} />
          <NumberField label="العرض (مم)" value={nightstand.width} onChange={(v) => set('width', v)} />
          <NumberField label="العمق (مم)" value={nightstand.depth} onChange={(v) => set('depth', v)} />
          <NumberField label="الارتفاع (مم)" value={nightstand.height} onChange={(v) => set('height', v)} />
          <NumberField label="سمك الجوانب (مم)" value={nightstand.sideThicknessMm} onChange={(v) => set('sideThicknessMm', v)} />
          <NumberField label="عدد الأدراج" value={nightstand.drawerCount} min={0} onChange={(v) => set('drawerCount', Math.max(0, v))} />
          <NumberField label="فراغ واجهة الدرج (مم)" value={nightstand.drawerFrontGapMm} onChange={(v) => set('drawerFrontGapMm', v)} />
          <NumberField label="فراغ سكة الدرج (مم)" value={nightstand.slideRunnerClearanceMm} onChange={(v) => set('slideRunnerClearanceMm', v)} />
          <SelectField
            label="خامة الظهر وقواعد الأدراج (رقيقة)"
            value={nightstand.thinMaterialId}
            options={materials.map((m) => ({ value: m.id, label: m.nameAr }))}
            onChange={(v) => set('thinMaterialId', v)}
          />
        </div>
      )}
    </fieldset>
  );
}
