import { useState } from 'react';
import type { BedFurnitureItem, FreeFurnitureItem, FurnitureItem, FurnitureKind, Material, NightstandFurnitureItem } from '../../models';
import { BedIcon, FreePartsIcon, NightstandIcon } from '../icons';
import { BedFields } from './BedFields';
import { NightstandFields } from './NightstandFields';
import { FreePartsFields } from './FreePartsFields';
import { SelectField, TextField } from './fields';

interface Props {
  furniture: FurnitureItem[];
  materials: Material[];
  onChange: (furniture: FurnitureItem[]) => void;
}

const KIND_OPTIONS: Array<{ value: FurnitureKind; label: string }> = [
  { value: 'bed', label: 'سرير (قواعد بارامترية)' },
  { value: 'nightstand', label: 'كومودينو (قواعد بارامترية)' },
  { value: 'wardrobe', label: 'دولاب (أبعاد يدوية)' },
  { value: 'dressing-table', label: 'دريسينج (أبعاد يدوية)' },
  { value: 'dining-table', label: 'ترابيزة سفرة (أبعاد يدوية)' },
  { value: 'kitchen-unit', label: 'وحدة مطبخ (أبعاد يدوية)' },
  { value: 'other', label: 'حاجة تانية (أبعاد يدوية)' },
];

const KIND_LABELS: Record<FurnitureKind, string> = {
  bed: 'سرير',
  nightstand: 'كومودينو',
  wardrobe: 'دولاب',
  'dressing-table': 'دريسينج',
  'dining-table': 'ترابيزة سفرة',
  'kitchen-unit': 'وحدة مطبخ',
  other: 'قطعة أثاث',
};

let seq = 5000;
const nextId = (prefix: string) => `${prefix}-${seq++}`;

function defaultBedSpec(materialId: string): BedFurnitureItem['spec'] {
  return {
    mattress: { width: 1600, length: 2000, thicknessMm: 250 },
    sideThicknessMm: 18,
    frameThicknessMm: 18,
    baseHeightMm: 350,
    backHeightMm: 900,
    mechanismClearanceMm: 22,
    backMaterial: 'wood',
    materialId,
    mattressBaseType: 'solid',
    slatWidthMm: 100,
    slatGapMm: 40,
    slatThicknessMm: 15,
  };
}

function defaultNightstandSpec(materialId: string, thinMaterialId: string): NightstandFurnitureItem['spec'] {
  return {
    quantity: 2,
    width: 450,
    depth: 400,
    height: 500,
    sideThicknessMm: 18,
    drawerCount: 2,
    drawerFrontGapMm: 3,
    slideRunnerClearanceMm: 13,
    materialId,
    thinMaterialId,
  };
}

function kindIcon(kind: FurnitureKind) {
  if (kind === 'bed') return <BedIcon />;
  if (kind === 'nightstand') return <NightstandIcon />;
  return <FreePartsIcon />;
}

/**
 * The single place every piece of furniture lives: pick a type, hit add, get a card.
 * Bed/nightstand cards carry their parametric rule-engine fields; everything else is a
 * manual "free parts" card — but all of it lands in the one `furniture[]` list that
 * `deriveProject()` reads.
 */
export function FurnitureList({ furniture, materials, onChange }: Props) {
  const [pendingKind, setPendingKind] = useState<FurnitureKind>('bed');
  const mainMaterialId = materials[0]?.id ?? '';
  const thinMaterialId = materials.find((m) => m.thicknessMm <= 9)?.id ?? mainMaterialId;

  const addItem = () => {
    const countOfKind = furniture.filter((f) => f.kind === pendingKind).length + 1;
    const name = countOfKind > 1 ? `${KIND_LABELS[pendingKind]} ${countOfKind}` : KIND_LABELS[pendingKind];

    if (pendingKind === 'bed') {
      const item: BedFurnitureItem = { id: nextId('BED'), kind: 'bed', name, spec: defaultBedSpec(mainMaterialId) };
      onChange([...furniture, item]);
    } else if (pendingKind === 'nightstand') {
      const item: NightstandFurnitureItem = { id: nextId('NS'), kind: 'nightstand', name, spec: defaultNightstandSpec(mainMaterialId, thinMaterialId) };
      onChange([...furniture, item]);
    } else {
      const item: FreeFurnitureItem = { id: nextId('FREE'), kind: pendingKind, name, parts: [] };
      onChange([...furniture, item]);
    }
  };

  const updateItem = (id: string, patch: Partial<FurnitureItem>) =>
    onChange(furniture.map((f) => (f.id === id ? ({ ...f, ...patch } as FurnitureItem) : f)));
  const removeItem = (id: string) => onChange(furniture.filter((f) => f.id !== id));

  return (
    <fieldset className="panel">
      <legend>قائمة الأثاث (Furniture list)</legend>
      <p className="hint">اختار نوع القطعة وضيفها — تقدر تضيف أي عدد من أي نوع (كذا سرير، كذا دولاب...).</p>

      <div className="add-row">
        <SelectField label="نوع القطعة" value={pendingKind} options={KIND_OPTIONS} onChange={setPendingKind} />
        <button type="button" onClick={addItem}>
          + إضافة
        </button>
      </div>

      <div className="sub-list">
        {furniture.map((item) => (
          <div className="furniture-card" key={item.id}>
            <div className="furniture-card-header">
              {kindIcon(item.kind)}
              <TextField label="" value={item.name} onChange={(v) => updateItem(item.id, { name: v })} />
              <button type="button" className="danger" onClick={() => removeItem(item.id)}>
                حذف
              </button>
            </div>

            {item.kind === 'bed' && <BedFields spec={item.spec} materials={materials} onChange={(spec) => updateItem(item.id, { spec })} />}
            {item.kind === 'nightstand' && <NightstandFields spec={item.spec} materials={materials} onChange={(spec) => updateItem(item.id, { spec })} />}
            {item.kind !== 'bed' && item.kind !== 'nightstand' && (
              <FreePartsFields item={item} materials={materials} onChange={(patch) => updateItem(item.id, patch)} />
            )}
          </div>
        ))}
        {furniture.length === 0 && <p className="empty-row">لسه مفيش قطع — ضيف أول قطعة أثاث من فوق.</p>}
      </div>
    </fieldset>
  );
}
