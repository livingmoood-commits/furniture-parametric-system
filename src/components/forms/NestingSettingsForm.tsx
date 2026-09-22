import type { DisplayUnit, NestingSettings } from '../../models';
import { LengthField } from './fields';
import { SettingsIcon } from '../icons';

interface Props {
  nesting: NestingSettings;
  displayUnit: DisplayUnit;
  onNestingChange: (nesting: NestingSettings) => void;
}

/** The mm/cm switch itself now lives in the app header, always visible — see App.tsx. */
export function NestingSettingsForm({ nesting, displayUnit, onNestingChange }: Props) {
  return (
    <fieldset className="panel">
      <legend>
        <SettingsIcon /> إعدادات التقطيع (Nesting)
      </legend>
      <div className="field-grid">
        <LengthField label="الكيرف - Kerf" unit={displayUnit} valueMm={nesting.kerfMm} onChangeMm={(v) => onNestingChange({ ...nesting, kerfMm: v })} />
        <LengthField label="هامش حافة اللوح" unit={displayUnit} valueMm={nesting.edgeMarginMm} onChangeMm={(v) => onNestingChange({ ...nesting, edgeMarginMm: v })} />
      </div>
    </fieldset>
  );
}
