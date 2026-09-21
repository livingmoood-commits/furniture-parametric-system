import { useEffect, useRef, useState, type ReactNode } from 'react';
import { FullscreenEnterIcon, FullscreenExitIcon } from './icons';

interface Props {
  className?: string;
  children: ReactNode;
}

/**
 * Wraps any card (a board drawing, an exploded diagram, ...) with a button that puts
 * JUST that element into the browser's native fullscreen mode — useful for reading a
 * dense drawing up close without the sidebar/tab-bar chrome around it.
 */
export function FullscreenSection({ className, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === ref.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggle = () => {
    if (!ref.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      ref.current.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div ref={ref} className={`fullscreen-host ${className ?? ''}${isFullscreen ? ' is-fullscreen' : ''}`}>
      <button type="button" className="fullscreen-btn" onClick={toggle} title={isFullscreen ? 'إغلاق ملء الشاشة' : 'ملء الشاشة'}>
        {isFullscreen ? <FullscreenExitIcon /> : <FullscreenEnterIcon />}
      </button>
      {children}
    </div>
  );
}
