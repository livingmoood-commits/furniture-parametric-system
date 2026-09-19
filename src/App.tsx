import { useMemo, useState, type ComponentType } from 'react';
import type { Project } from './models';
import { createDefaultProject } from './data/defaultProject';
import { deriveProject } from './engine/derive';
import { BedForm } from './components/forms/BedForm';
import { NightstandForm } from './components/forms/NightstandForm';
import { FreeFurnitureForm } from './components/forms/FreeFurnitureForm';
import { MaterialsBoardsForm } from './components/forms/MaterialsBoardsForm';
import { NestingSettingsForm } from './components/forms/NestingSettingsForm';
import { SummaryView } from './components/results/SummaryView';
import { CuttingListView } from './components/results/CuttingListView';
import { BoardCuttingView } from './components/results/BoardCuttingView';
import { ExplodedView } from './components/results/ExplodedView';
import { AssemblyView } from './components/results/AssemblyView';
import { HardwareView } from './components/results/HardwareView';
import { QCView } from './components/results/QCView';
import {
  AssemblyIcon,
  BoardCuttingIcon,
  CuttingListIcon,
  ExplodedIcon,
  FinalProductIcon,
  HardwareIcon,
  PrintIcon,
  QCIcon,
} from './components/icons';
import './App.css';

type Tab = 'summary' | 'cutting-list' | 'board-cutting' | 'exploded' | 'assembly' | 'hardware' | 'qc';

const TABS: Array<{ id: Tab; label: string; icon: ComponentType<{ className?: string }> }> = [
  { id: 'summary', label: '01 · المنتج النهائي', icon: FinalProductIcon },
  { id: 'cutting-list', label: '05 · قائمة التقطيع', icon: CuttingListIcon },
  { id: 'board-cutting', label: '08 · تقطيع الألواح', icon: BoardCuttingIcon },
  { id: 'exploded', label: 'المنظور المتفكك', icon: ExplodedIcon },
  { id: 'assembly', label: '09 · تعليمات التجميع', icon: AssemblyIcon },
  { id: 'hardware', label: '07 · Hardware', icon: HardwareIcon },
  { id: 'qc', label: '10 · الفحص النهائي', icon: QCIcon },
];

function App() {
  const [project, setProject] = useState<Project>(createDefaultProject);
  const [tab, setTab] = useState<Tab>('summary');

  const derived = useMemo(() => deriveProject(project), [project]);

  const materialNames = useMemo(() => Object.fromEntries(project.materials.map((m) => [m.id, m.nameAr])), [project.materials]);

  return (
    <div className="app-shell" dir="ltr" lang="ar">
      <header className="app-header">
        <div className="brand">
          <img src="/favicon.svg" alt="LM" className="brand-mark" />
          <div>
            <h1>نظام تصنيع الأثاث البارامتري</h1>
            <p>PARAMETRIC FURNITURE MANUFACTURING SYSTEM — من المقاسات لملف تصنيع جاهز للمصنع</p>
          </div>
        </div>
        <button type="button" className="print-btn" onClick={() => window.print()}>
          <PrintIcon />
          طباعة / تصدير PDF لملف التصنيع
        </button>
      </header>

      <div className="app-body">
        <aside className="app-sidebar">
          <BedForm bed={project.bed} onChange={(bed) => setProject({ ...project, bed })} />
          <NightstandForm nightstand={project.nightstand} materials={project.materials} onChange={(nightstand) => setProject({ ...project, nightstand })} />
          <FreeFurnitureForm items={project.freeFurniture} materials={project.materials} onChange={(freeFurniture) => setProject({ ...project, freeFurniture })} />
          <MaterialsBoardsForm
            materials={project.materials}
            boards={project.boards}
            onMaterialsChange={(materials) => setProject({ ...project, materials })}
            onBoardsChange={(boards) => setProject({ ...project, boards })}
          />
          <NestingSettingsForm
            nesting={project.nesting}
            displayUnit={project.displayUnit}
            onNestingChange={(nesting) => setProject({ ...project, nesting })}
            onDisplayUnitChange={(displayUnit) => setProject({ ...project, displayUnit })}
          />
        </aside>

        <main className="app-main">
          <nav className="tab-bar">
            {TABS.map((t) => (
              <button key={t.id} type="button" className={t.id === tab ? 'tab active' : 'tab'} onClick={() => setTab(t.id)}>
                <t.icon />
                {t.label}
              </button>
            ))}
          </nav>

          <section className="tab-content">
            {tab === 'summary' && <SummaryView project={project} derived={derived} />}
            {tab === 'cutting-list' && <CuttingListView parts={derived.parts} materials={project.materials} displayUnit={project.displayUnit} />}
            {tab === 'board-cutting' && <BoardCuttingView boards={derived.nesting.boards} materialNames={materialNames} />}
            {tab === 'exploded' && <ExplodedView components={derived.components} parts={derived.parts} />}
            {tab === 'assembly' && <AssemblyView instructions={derived.assembly} />}
            {tab === 'hardware' && <HardwareView items={derived.hardware} edgeBanding={derived.edgeBanding} materials={project.materials} />}
            {tab === 'qc' && <QCView items={derived.qc} unplaced={derived.nesting.unplacedParts} />}
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
