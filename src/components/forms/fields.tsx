import type { DisplayUnit } from '../../models';
import { displayToMm, mmToDisplay } from '../../engine/units';

export function NumberField({ label, value, onChange, step = 1, min }: { label: string; value: number; onChange: (v: number) => void; step?: number; min?: number }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="number" value={value} step={step} min={min} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function roundForDisplay(v: number, unit: DisplayUnit): number {
  const factor = unit === 'cm' ? 10 : 1;
  return Math.round(v * factor) / factor;
}

/**
 * A length input that's always stored in mm but edited in whatever unit the project is
 * currently displayed in — switching the unit toggle changes what this field shows AND
 * what typing into it means, not just how the cutting list prints the number afterwards.
 */
export function LengthField({
  label,
  valueMm,
  unit,
  onChangeMm,
  min,
}: {
  label: string;
  valueMm: number;
  unit: DisplayUnit;
  onChangeMm: (mm: number) => void;
  min?: number;
}) {
  const displayValue = roundForDisplay(mmToDisplay(valueMm, unit), unit);
  const step = unit === 'cm' ? 0.1 : 1;
  const suffix = unit === 'cm' ? 'سم' : 'مم';
  return (
    <label className="field">
      <span>
        {label} ({suffix})
      </span>
      <input type="number" value={displayValue} step={step} min={min !== undefined ? mmToDisplay(min, unit) : undefined} onChange={(e) => onChangeMm(displayToMm(Number(e.target.value), unit))} />
    </label>
  );
}

export function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function SelectField<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Array<{ value: T; label: string }>; onChange: (v: T) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
