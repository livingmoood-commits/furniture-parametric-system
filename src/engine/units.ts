import type { DisplayUnit } from '../models';

/** mm → 1 display unit. The single source every mm/cm/m conversion in the app reads from. */
export const UNIT_FACTOR: Record<DisplayUnit, number> = { mm: 1, cm: 10, m: 1000 };

export const UNIT_SUFFIX: Record<DisplayUnit, string> = { mm: 'مم', cm: 'سم', m: 'م' };

/** Sensible input step per unit — whole mm, one-decimal cm, two-decimal metres. */
export const UNIT_STEP: Record<DisplayUnit, number> = { mm: 1, cm: 0.1, m: 0.01 };

/** All internal math is mm. This only affects what the UI prints. */
export function formatLength(mm: number, unit: DisplayUnit, digits?: number): string {
  const value = mm / UNIT_FACTOR[unit];
  const d = digits ?? (unit === 'mm' ? 0 : unit === 'cm' ? 1 : 2);
  return `${value.toFixed(d)} ${UNIT_SUFFIX[unit]}`;
}

export function mmToDisplay(mm: number, unit: DisplayUnit): number {
  return mm / UNIT_FACTOR[unit];
}

export function displayToMm(value: number, unit: DisplayUnit): number {
  return value * UNIT_FACTOR[unit];
}
