export type MaterialType =
  | 'melamine'
  | 'mdf'
  | 'solid-wood'
  | 'fabric-leather'
  | 'foam'
  | 'other';

export interface Material {
  id: string;
  name: string;
  nameAr: string;
  thicknessMm: number;
  type: MaterialType;
}
