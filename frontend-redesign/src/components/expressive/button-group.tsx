import type { ReactNode } from 'react';
/** Connected action buttons, not a selection control. Uses the existing Button primitive. */
export function ButtonGroup({ children, label }: { children: ReactNode; label: string }) {
  return <div className="ex-connected-actions" role="group" aria-label={label}>{children}</div>;
}
