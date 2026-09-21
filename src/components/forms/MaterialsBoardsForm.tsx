import type { Board, DisplayUnit, Material, MaterialType } from '../../models';
import { LengthField, NumberField, SelectField, TextField } from './fields';
import { MaterialsIcon } from '../icons';

interface Props {
  materials: Material[];
  boards: Board[];
  displayUnit: DisplayUnit;
  onMaterialsChange: (materials: Material[]) => void;
  onBoardsChange: (boards: Board[]) => void;
}

const MATERIAL_TYPE_OPTIONS: Array<{ value: MaterialType; label: string }> = [
  { value: 'melamine', label: 'أبلاكاش مليلامين' },
  { value: 'mdf', label: 'MDF' },
  { value: 'solid-wood', label: 'خشب طبيعي' },
  { value: 'fabric-leather', label: 'قماش/جلد' },
  { value: 'foam', label: 'إسفنج' },
  { value: 'other', label: 'أخرى' },
];

let seq = 1000;
const nextId = (prefix: string) => `${prefix}-${seq++}`;

export function MaterialsBoardsForm({ materials, boards, displayUnit, onMaterialsChange, onBoardsChange }: Props) {
  const updateMaterial = (id: string, patch: Partial<Material>) =>
    onMaterialsChange(materials.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const addMaterial = () => {
    const id = nextId('MAT');
    onMaterialsChange([...materials, { id, name: 'New material', nameAr: 'خامة جديدة', thicknessMm: 18, type: 'melamine' }]);
  };

  const removeMaterial = (id: string) => {
    onMaterialsChange(materials.filter((m) => m.id !== id));
    onBoardsChange(boards.filter((b) => b.materialId !== id));
  };

  const updateBoard = (id: string, patch: Partial<Board>) => onBoardsChange(boards.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const addBoard = () => {
    const id = nextId('BOARD');
    onBoardsChange([...boards, { id, materialId: materials[0]?.id ?? '', length: 2440, width: 1220, thicknessMm: materials[0]?.thicknessMm ?? 18, qtyAvailable: 10 }]);
  };

  const removeBoard = (id: string) => onBoardsChange(boards.filter((b) => b.id !== id));

  return (
    <fieldset className="panel">
      <legend>
        <MaterialsIcon /> الخامات والألواح (Materials &amp; Boards)
      </legend>

      <div className="sub-list">
        {materials.map((m) => (
          <div className="sub-item" key={m.id}>
            <div className="field-grid">
              <TextField label="الاسم بالعربي" value={m.nameAr} onChange={(v) => updateMaterial(m.id, { nameAr: v })} />
              <LengthField label="السمك" unit={displayUnit} valueMm={m.thicknessMm} onChangeMm={(v) => updateMaterial(m.id, { thicknessMm: v })} />
              <SelectField label="النوع" value={m.type} options={MATERIAL_TYPE_OPTIONS} onChange={(v) => updateMaterial(m.id, { type: v })} />
            </div>
            <button type="button" className="danger" onClick={() => removeMaterial(m.id)}>
              حذف الخامة
            </button>
          </div>
        ))}
        <button type="button" onClick={addMaterial}>
          + إضافة خامة
        </button>
      </div>

      <div className="sub-list">
        <h4>الألواح الخام (Boards)</h4>
        {boards.map((b) => (
          <div className="sub-item" key={b.id}>
            <div className="field-grid">
              <SelectField
                label="الخامة"
                value={b.materialId}
                options={materials.map((m) => ({ value: m.id, label: m.nameAr }))}
                onChange={(v) => updateBoard(b.id, { materialId: v, thicknessMm: materials.find((m) => m.id === v)?.thicknessMm ?? b.thicknessMm })}
              />
              <LengthField label="الطول" unit={displayUnit} valueMm={b.length} onChangeMm={(v) => updateBoard(b.id, { length: v })} />
              <LengthField label="العرض" unit={displayUnit} valueMm={b.width} onChangeMm={(v) => updateBoard(b.id, { width: v })} />
              <NumberField label="الكمية المتاحة" value={b.qtyAvailable} min={0} onChange={(v) => updateBoard(b.id, { qtyAvailable: v })} />
            </div>
            <button type="button" className="danger" onClick={() => removeBoard(b.id)}>
              حذف اللوح
            </button>
          </div>
        ))}
        <button type="button" onClick={addBoard}>
          + إضافة لوح
        </button>
      </div>
    </fieldset>
  );
}
