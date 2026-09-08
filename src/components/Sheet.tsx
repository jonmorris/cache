import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface SheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Pinned below the scrolling body, so actions never scroll out of reach. */
  footer?: ReactNode;
}

/**
 * Bottom sheet rendered through a portal on document.body.
 *
 * This must not be mounted inside the scrolling screen: iOS treats a
 * touch-scrolling container as a containing block for position:fixed, so a
 * sheet nested in one is clipped by that container and ends up behind the tab
 * bar. Portalling to <body> keeps the viewport as its containing block.
 */
export function Sheet({ open, title, onClose, children, footer }: SheetProps) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      restoreFocus.current = document.activeElement as HTMLElement | null;
      setMounted(true);
      const frame = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(frame);
    }
    setShown(false);
    const timer = setTimeout(() => setMounted(false), 240);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    document.body.classList.add('no-scroll');
    return () => document.body.classList.remove('no-scroll');
  }, [mounted]);

  /*
   * Callers pass inline arrows for onClose, so its identity changes on every
   * render of the screen behind the sheet. Keeping it in a ref keeps it out of
   * the dependency lists below: focus must move exactly once, when the sheet
   * opens or closes. Re-running it on each render pulled focus off whatever the
   * user was typing in and dismissed the keyboard on iOS.
   */
  const latestClose = useRef(onClose);
  useEffect(() => {
    latestClose.current = onClose;
  });

  useEffect(() => {
    if (!open) {
      restoreFocus.current?.focus?.();
      return;
    }
    panel.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') latestClose.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <div className="sheet-root" data-shown={shown}>
      <div className="sheet-scrim" onClick={onClose} />
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={panel}
      >
        <div className="sheet-head">
          <h2 className="sheet-title">{title}</h2>
          <button className="sheet-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
