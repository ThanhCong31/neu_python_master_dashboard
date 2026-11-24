import type { ReactNode } from 'react';
import './data-workspace.css';
/** Informational, non-interactive; domain decides the tone and text. */
export function StatusLabel({tone='neutral',children}:{tone?:'neutral'|'primary'|'secondary'|'tertiary'|'error';children:ReactNode}) {
  return <span className="dw-status" data-tone={tone}>{children}</span>;
}
