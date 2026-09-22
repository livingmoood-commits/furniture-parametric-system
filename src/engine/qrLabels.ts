import QRCode from 'qrcode';
import type { BoardInstance, Part } from '../models';

export interface PartLabel {
  partId: string;
  instanceIndex: number;
  nameAr: string;
  lengthMm: number;
  widthMm: number;
  thicknessMm: number;
  boardInstanceId: string | undefined;
  qrPayload: string;
}

/**
 * One label per PHYSICAL part instance — a part with quantity 3 produces 3 labels, each with
 * a distinct qrPayload (instanceIndex is baked in) so two identical copies of the same part
 * never share a QR code, even though their name/dimensions are identical.
 */
export function buildPartLabels(parts: Part[], boards: BoardInstance[], projectName: string): PartLabel[] {
  const boardByInstance = new Map<string, string>();
  for (const board of boards) {
    for (const placement of board.placements) {
      boardByInstance.set(`${placement.partId}#${placement.instanceIndex}`, board.boardInstanceId);
    }
  }

  const labels: PartLabel[] = [];
  for (const part of parts) {
    for (let instanceIndex = 0; instanceIndex < part.quantity; instanceIndex++) {
      const qrPayload = JSON.stringify({
        partId: part.id,
        instanceIndex,
        dimensions: { length: part.dimensions.length, width: part.dimensions.width, thicknessMm: part.dimensions.thicknessMm },
        projectName,
      });
      labels.push({
        partId: part.id,
        instanceIndex,
        nameAr: part.nameAr ?? part.name,
        lengthMm: part.dimensions.length,
        widthMm: part.dimensions.width,
        thicknessMm: part.dimensions.thicknessMm,
        boardInstanceId: boardByInstance.get(`${part.id}#${instanceIndex}`),
        qrPayload,
      });
    }
  }
  return labels;
}

function escapeHtml(s: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return s.replace(/[&<>"']/g, (c) => map[c]);
}

/**
 * Renders every label's QR as a data URL, then opens a print-ready page: one 50x30mm label
 * per part instance. Opens the window SYNCHRONOUSLY, before the async QR generation — a
 * window.open() issued after an await falls outside the click's user-gesture window and gets
 * popup-blocked in most browsers, so the blank window is claimed first and filled in once ready.
 */
export async function printPartLabels(parts: Part[], boards: BoardInstance[], projectName: string): Promise<void> {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  win.document.write('<p style="font-family: sans-serif; padding: 20px;">بيجهّز الليابلات...</p>');

  const labels = buildPartLabels(parts, boards, projectName);
  const withQr = await Promise.all(
    labels.map(async (label) => ({ ...label, qrDataUrl: await QRCode.toDataURL(label.qrPayload, { width: 140, margin: 0 }) }))
  );

  const labelsHtml = withQr
    .map(
      (l) => `
    <div class="label">
      <img src="${l.qrDataUrl}" alt="QR" />
      <div class="info">
        <div class="name">${escapeHtml(l.nameAr)}</div>
        <div class="dims">${l.lengthMm}×${l.widthMm}×${l.thicknessMm}مم</div>
        <div class="board">${l.boardInstanceId ? escapeHtml(l.boardInstanceId) : '—'}</div>
      </div>
    </div>`
    )
    .join('');

  win.document.open(); // clear the "بيجهّز الليابلات..." placeholder before writing the real page
  win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8" />
<title>ليابلات QR — ${escapeHtml(projectName)}</title>
<style>
  @page { size: auto; margin: 4mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; margin: 0; }
  .sheet { display: flex; flex-wrap: wrap; gap: 2mm; }
  .label {
    width: 50mm;
    height: 30mm;
    border: 1px solid #333;
    display: flex;
    align-items: center;
    gap: 2mm;
    padding: 1.5mm;
    page-break-inside: avoid;
    overflow: hidden;
  }
  .label img { width: 20mm; height: 20mm; flex-shrink: 0; }
  .info { font-size: 7pt; line-height: 1.4; overflow: hidden; }
  .name { font-weight: 700; font-size: 7.5pt; }
  .dims { color: #444; }
  .board { color: #777; }
</style>
</head>
<body>
  <div class="sheet">${labelsHtml}</div>
  <script>window.onload = () => setTimeout(() => window.print(), 200);</script>
</body>
</html>`);
  win.document.close();
}
