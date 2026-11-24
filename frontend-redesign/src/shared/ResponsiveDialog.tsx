import { useId, useLayoutEffect, useRef, type ReactNode } from 'react';
import { IconButton } from '@/components/expressive/icon-button';
import { X } from 'lucide-react';
import './data-workspace.css';

/** Native modal retained for reliable top-layer and focus behavior. No outside-press dismissal. */
export function ResponsiveDialog({ title, children, footer, onClose, dismissible = true, className = '' }: {
  title: string; children: ReactNode; footer?: ReactNode; onClose: () => void; dismissible?: boolean; className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const previous = document.activeElement;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);
  return <dialog className={`dw-dialog ${className}`} ref={ref} aria-labelledby={id} aria-busy={!dismissible || undefined}
    onCancel={e => { e.preventDefault(); if (dismissible) onClose(); }}>
    <header className="dw-dialog-head"><h2 id={id}>{title}</h2><IconButton aria-label="Đóng" variant="standard" motion="standard" disabled={!dismissible} onClick={onClose}><X aria-hidden="true"/></IconButton></header>
    <div className="dw-dialog-body">{children}</div>
    {footer && <footer className="dw-dialog-foot">{footer}</footer>}
  </dialog>;
}
