import type { DisplayUnit } from '../models';

/** All internal math is mm. This only affects what the UI prints. */
export function formatLength(mm: number, unit: DisplayUnit, digits = 1): string {
  if (unit === 'cm') return `${(mm / 10).toFixed(digits)} سم`;
  return `${Math.round(mm)} مم`;
}

export function mmToDisplay(mm: number, unit: DisplayUnit): number {
  return unit === 'cm' ? mm / 10 : mm;
}

export function displayToMm(value: number, unit: DisplayUnit): number {
  return unit === 'cm' ? value * 10 : value;
}
