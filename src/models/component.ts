/** A logical grouping of parts for display/assembly purposes only — never an independent manufacturing unit. */
export interface Component {
  id: string;
  name: string;
  nameAr?: string;
  partIds: string[];
}
