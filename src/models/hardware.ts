export type HardwareCategory =
  | 'mechanism'
  | 'runner'
  | 'bracket'
  | 'fastener'
  | 'electrical'
  | 'leg'
  | 'trim'
  | 'other';

/** Accessories/finishing items — always derived from part & component counts, never hand-typed. */
export interface HardwareItem {
  id: string;
  name: string;
  nameAr?: string;
  category: HardwareCategory;
  quantity: number;
  unit: string; // 'piece' | 'meter' | 'set' ...
  note?: string;
  noteAr?: string;
}
