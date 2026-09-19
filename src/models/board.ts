/** Raw sheet stock a part is cut from. Standard default is 1220x2440mm, fully editable. */
export interface Board {
  id: string;
  materialId: string;
  length: number; // mm
  width: number; // mm
  thicknessMm: number;
  /** Number of physical boards of this spec on hand. Use Infinity for "unlimited supply". */
  qtyAvailable: number;
}
