import type { Component, HardwareItem, NestingResult, Part, Project } from '../models';
import { deriveBedGeometry, type BedDerivedGeometry } from './rules/bedRules';
import { generateBedParts } from './generators/bedPartGenerator';
import { generateNightstandParts } from './generators/nightstandPartGenerator';
import { generateFreeFurnitureParts } from './generators/freeFurnitureGenerator';
import { splitOversizedParts } from './nesting/splitOversized';
import { runNesting } from './nesting/nestingEngine';
import { computeHardware, computeEdgeBandingSummary, type EdgeBandingSummary } from './hardwareEngine';
import { buildAssemblyInstructions, type AssemblyInstruction } from './assemblyEngine';
import { buildFinalQC, type QCItem } from './qcEngine';

export interface BedGeometryEntry {
  itemId: string;
  name: string;
  geometry: BedDerivedGeometry;
}

export interface DerivedProject {
  parts: Part[];
  components: Component[];
  hardware: HardwareItem[];
  edgeBanding: EdgeBandingSummary[];
  assembly: AssemblyInstruction[];
  nesting: NestingResult;
  qc: QCItem[];
  bedGeometries: BedGeometryEntry[];
}

/**
 * The single entry point for the whole "One Source of Truth" pipeline:
 * DATA -> ENGINEERING MODEL -> PARTS -> CUTTING LIST -> NESTING -> DRAWINGS -> PACKAGE.
 * Every screen in the app reads from this function's output — nothing downstream
 * recomputes or re-derives a number on its own. `project.furniture` is one list: any
 * number of beds, nightstands or free-form pieces, each contributing parts the same way.
 */
export function deriveProject(project: Project): DerivedProject {
  let parts: Part[] = [];
  let components: Component[] = [];
  const bedGeometries: BedGeometryEntry[] = [];

  for (const item of project.furniture) {
    if (item.kind === 'bed') {
      const bedMaterialBoards = project.boards.filter((b) => b.materialId === item.spec.materialId);
      const usableBoardWidth =
        bedMaterialBoards.length > 0
          ? Math.max(...bedMaterialBoards.map((b) => b.width)) - 2 * project.nesting.edgeMarginMm
          : Infinity;
      const geometry = deriveBedGeometry(item.spec, usableBoardWidth);
      bedGeometries.push({ itemId: item.id, name: item.name, geometry });
      const bedGen = generateBedParts(item.id, item.spec, geometry);
      parts.push(...bedGen.parts);
      components.push(...bedGen.components);
    } else if (item.kind === 'nightstand') {
      const thinMaterial = project.materials.find((m) => m.id === item.spec.thinMaterialId);
      const nsGen = generateNightstandParts(item.id, item.name, item.spec, {
        id: item.spec.thinMaterialId,
        thicknessMm: thinMaterial?.thicknessMm ?? item.spec.sideThicknessMm,
      });
      parts.push(...nsGen.parts);
      components.push(...nsGen.components);
    } else {
      const freeGen = generateFreeFurnitureParts([item]);
      parts.push(...freeGen.parts);
      components.push(...freeGen.components);
    }
  }

  parts = splitOversizedParts(parts, project.boards);

  const nesting = runNesting(parts, project.boards, project.nesting);
  const hardware = computeHardware(project, parts);
  const edgeBanding = computeEdgeBandingSummary(parts);
  const assembly = buildAssemblyInstructions(parts);
  const qc = buildFinalQC(project, parts, nesting);

  return { parts, components, hardware, edgeBanding, assembly, nesting, qc, bedGeometries };
}
