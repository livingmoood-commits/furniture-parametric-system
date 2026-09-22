/** Raw sheet stock a part is cut from. Standard default is 1220x2440mm, fully editable. */
export interface Board {
  id: string;
  materialId: string;
  length: number; // mm
  width: number; // mm
  thicknessMm: number;
  /** Number of physical boards of this spec on hand. Use Infinity for "unlimited supply". */
  qtyAvailable: number;
  /** Price for one physical board of this spec. Undefined means "not recorded" — cost
   * calculations must surface that explicitly rather than silently treating it as free. */
  pricePerBoard?: number;
}
