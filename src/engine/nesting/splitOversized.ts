import type { Board, Part } from '../../models';

/**
 * A part bigger than every available board (in both orientations) can never be nested
 * as-is. Split it along its longer offending axis into equal pieces that DO fit — and
 * register the split so the cutting list / drawings show it as separate pieces, per spec
 * (e.g. a 1600mm lift platform against a 1210mm usable board becomes two 800mm pieces).
 */
export function splitOversizedParts(parts: Part[], boards: Board[]): Part[] {
  if (boards.length === 0) return parts;
  const maxBoardDim = Math.max(...boards.flatMap((b) => [b.length, b.width]));
  if (!isFinite(maxBoardDim) || maxBoardDim <= 0) return parts;

  const result: Part[] = [];
  for (const part of parts) {
    const { length, width } = part.dimensions;
    const overLength = length > maxBoardDim;
    const overWidth = width > maxBoardDim;

    if (!overLength && !overWidth) {
      result.push(part);
      continue;
    }

    const axis: 'length' | 'width' = overLength && (!overWidth || length >= width) ? 'length' : 'width';
    const dim = axis === 'length' ? length : width;
    const pieces = Math.ceil(dim / maxBoardDim);
    const pieceSize = dim / pieces;

    for (let i = 1; i <= pieces; i++) {
      result.push({
        ...part,
        id: `${part.id}-${String.fromCharCode(64 + i)}`,
        name: `${part.name} (${i}/${pieces})`,
        nameAr: part.nameAr ? `${part.nameAr} (${i}/${pieces})` : undefined,
        dimensions:
          axis === 'length'
            ? { ...part.dimensions, length: pieceSize }
            : { ...part.dimensions, width: pieceSize },
        splitInfo: { originalPartId: part.id, index: i, of: pieces, axis },
      });
    }
  }
  return result;
}
