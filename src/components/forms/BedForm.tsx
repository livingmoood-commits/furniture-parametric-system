import type { BedSpec } from '../../models';
import { NumberField } from './fields';
import { BedIcon } from '../icons';

interface Props {
  bed: BedSpec;
  onChange: (bed: BedSpec) => void;
}

export function BedForm({ bed, onChange }: Props) {
  const set = <K extends keyof BedSpec>(key: K, value: BedSpec[K]) => onChange({ ...bed, [key]: value });

  return (
    <fieldset className="panel">
      <legend>
        <label className="switch">
          <input type="checkbox" checked={bed.enabled} onChange={(e) => set('enabled', e.target.checked)} />
          <BedIcon /> السرير (Bed)
        </label>
      </legend>
      {bed.enabled && (
        <div className="field-grid">
          <NumberField label="عرض المرتبة (مم)" value={bed.mattress.width} onChange={(v) => set('mattress', { ...bed.mattress, width: v })} />
          <NumberField label="طول المرتبة (مم)" value={bed.mattress.length} onChange={(v) => set('mattress', { ...bed.mattress, length: v })} />
          <NumberField label="سمك المرتبة (مم)" value={bed.mattress.thicknessMm} onChange={(v) => set('mattress', { ...bed.mattress, thicknessMm: v })} />
          <NumberField label="سمك جوانب الهيكل (مم)" value={bed.sideThicknessMm} onChange={(v) => set('sideThicknessMm', v)} />
          <NumberField label="سمك الفريم (مم)" value={bed.frameThicknessMm} onChange={(v) => set('frameThicknessMm', v)} />
          <NumberField label="ارتفاع القاعدة (مم)" value={bed.baseHeightMm} onChange={(v) => set('baseHeightMm', v)} />
          <NumberField label="ارتفاع الظهر (مم)" value={bed.backHeightMm} onChange={(v) => set('backHeightMm', v)} />
          <NumberField label="فراغ الميكانيزم الهيدروليكي (مم)" value={bed.mechanismClearanceMm} onChange={(v) => set('mechanismClearanceMm', v)} />
          <label className="field">
            <span>خامة الظهر</span>
            <select value={bed.backMaterial} onChange={(e) => set('backMaterial', e.target.value as BedSpec['backMaterial'])}>
              <option value="wood">خشب</option>
              <option value="upholstered">منجد</option>
              <option value="rattan">راتان</option>
            </select>
          </label>
        </div>
      )}
    </fieldset>
  );
}
