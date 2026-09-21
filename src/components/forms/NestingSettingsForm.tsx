import type { DisplayUnit, NestingSettings } from '../../models';
import { LengthField, SelectField } from './fields';
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
        <LengthField label="الكيرف - Kerf" unit={displayUnit} valueMm={nesting.kerfMm} onChangeMm={(v) => onNestingChange({ ...nesting, kerfMm: v })} />
        <LengthField label="هامش حافة اللوح" unit={displayUnit} valueMm={nesting.edgeMarginMm} onChangeMm={(v) => onNestingChange({ ...nesting, edgeMarginMm: v })} />
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
