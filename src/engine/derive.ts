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

export interface DerivedProject {
  parts: Part[];
  components: Component[];
  hardware: HardwareItem[];
  edgeBanding: EdgeBandingSummary[];
  assembly: AssemblyInstruction[];
  nesting: NestingResult;
  qc: QCItem[];
  bedGeometry?: BedDerivedGeometry;
}

/**
 * The single entry point for the whole "One Source of Truth" pipeline:
 * DATA -> ENGINEERING MODEL -> PARTS -> CUTTING LIST -> NESTING -> DRAWINGS -> PACKAGE.
 * Every screen in the app reads from this function's output — nothing downstream
 * recomputes or re-derives a number on its own.
 */
export function deriveProject(project: Project): DerivedProject {
  let parts: Part[] = [];
  let components: Component[] = [];
  let bedGeometry: BedDerivedGeometry | undefined;

  if (project.bed.enabled) {
    const bedMaterialBoards = project.boards.filter((b) => b.materialId === project.bed.materialId);
    const usableBoardWidth =
      bedMaterialBoards.length > 0
        ? Math.max(...bedMaterialBoards.map((b) => b.width)) - 2 * project.nesting.edgeMarginMm
        : Infinity;
    bedGeometry = deriveBedGeometry(project.bed, usableBoardWidth);
    const bedGen = generateBedParts(project.bed, bedGeometry);
    parts.push(...bedGen.parts);
    components.push(...bedGen.components);
  }

  if (project.nightstand.enabled) {
    const nsGen = generateNightstandParts(project.nightstand);
    parts.push(...nsGen.parts);
    components.push(...nsGen.components);
  }

  if (project.freeFurniture.length > 0) {
    const freeGen = generateFreeFurnitureParts(project.freeFurniture);
    parts.push(...freeGen.parts);
    components.push(...freeGen.components);
  }

  parts = splitOversizedParts(parts, project.boards);

  const nesting = runNesting(parts, project.boards, project.nesting);
  const hardware = computeHardware(project, parts);
  const edgeBanding = computeEdgeBandingSummary(parts);
  const assembly = buildAssemblyInstructions(parts);
  const qc = buildFinalQC(project, parts, nesting);

  return { parts, components, hardware, edgeBanding, assembly, nesting, qc, bedGeometry };
}
