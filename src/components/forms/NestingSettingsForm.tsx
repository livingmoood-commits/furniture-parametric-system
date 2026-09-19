import type { DisplayUnit, NestingSettings } from '../../models';
import { NumberField, SelectField } from './fields';
import { SettingsIcon } from '../icons';

interface Props {
  nesting: NestingSettings;
  displayUnit: DisplayUnit;
  onNestingChange: (nesting: NestingSettings) => void;
  onDisplayUnitChange: (unit: DisplayUnit) => void;
}

export function NestingSettingsForm({ nesting, displayUnit, onNestingChange, onDisplayUnitChange }: Props) {
  return (
    <fieldset className="panel">
      <legend>
        <SettingsIcon /> إعدادات التقطيع والعرض (Nesting &amp; Display)
      </legend>
      <div className="field-grid">
        <NumberField label="الكيرف - Kerf (مم)" value={nesting.kerfMm} onChange={(v) => onNestingChange({ ...nesting, kerfMm: v })} />
        <NumberField label="هامش حافة اللوح (مم)" value={nesting.edgeMarginMm} onChange={(v) => onNestingChange({ ...nesting, edgeMarginMm: v })} />
        <SelectField
          label="وحدة العرض"
          value={displayUnit}
          options={[
            { value: 'mm', label: 'ملي متر (mm)' },
            { value: 'cm', label: 'سنتيمتر (cm)' },
          ]}
          onChange={onDisplayUnitChange}
        />
      </div>
    </fieldset>
  );
}
