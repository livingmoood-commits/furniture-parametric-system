import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import type { Project } from './models';
import { createDefaultProject } from './data/defaultProject';
import { deriveProject } from './engine/derive';
import { FurnitureList } from './components/forms/FurnitureList';
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

const SIDEBAR_MIN = 300;
const SIDEBAR_MAX = 900;
const SIDEBAR_DEFAULT = 420;
const SIDEBAR_STORAGE_KEY = 'lm-sidebar-width';

/** Drag-to-resize the sidebar/main split, remembering the chosen width per browser. */
function useResizableSidebar() {
  const [width, setWidth] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem(SIDEBAR_STORAGE_KEY));
      return saved >= SIDEBAR_MIN && saved <= SIDEBAR_MAX ? saved : SIDEBAR_DEFAULT;
    } catch {
      return SIDEBAR_DEFAULT;
    }
  });
  const [dragging, setDragging] = useState(false);
  const startRef = useRef({ x: 0, width: SIDEBAR_DEFAULT });

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      startRef.current = { x: e.clientX, width };
      setDragging(true);
    },
    [width]
  );

  const resetWidth = useCallback(() => setWidth(SIDEBAR_DEFAULT), []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      const next = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startRef.current.width + (e.clientX - startRef.current.x)));
      setWidth(next);
    };
    const onUp = () => setDragging(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    document.body.classList.add('resizing-col');
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.classList.remove('resizing-col');
    };
  }, [dragging]);

  useEffect(() => {
    if (dragging) return;
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(width));
    } catch {
      /* per-viewer convenience only — fine to skip silently */
    }
  }, [width, dragging]);

  return { width, onPointerDown, resetWidth };
}

function App() {
  const [project, setProject] = useState<Project>(createDefaultProject);
  const [tab, setTab] = useState<Tab>('summary');
  const sidebar = useResizableSidebar();

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
        <aside className="app-sidebar" style={{ width: sidebar.width }}>
          <FurnitureList
            furniture={project.furniture}
            materials={project.materials}
            displayUnit={project.displayUnit}
            onChange={(furniture) => setProject({ ...project, furniture })}
          />
          <MaterialsBoardsForm
            materials={project.materials}
            boards={project.boards}
            displayUnit={project.displayUnit}
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

        <div
          className="sidebar-resizer"
          role="separator"
          aria-orientation="vertical"
          aria-label="تكبير/تصغير عرض القائمة الجانبية"
          onPointerDown={sidebar.onPointerDown}
          onDoubleClick={sidebar.resetWidth}
          title="اسحب لتغيير العرض — دبل كليك للرجوع للمقاس الافتراضي"
        />

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
            {tab === 'board-cutting' && (
              <BoardCuttingView boards={derived.nesting.boards} materialNames={materialNames} parts={derived.parts} displayUnit={project.displayUnit} />
            )}
            {tab === 'exploded' && <ExplodedView project={project} derived={derived} />}
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
