import type { ReactNode } from 'react';
import './workspace-controls.css';

/** M3 checkbox presentation with native input semantics (label, Space, form, disabled). */
export function Checkbox({ checked, onChange, disabled = false, children }: {
  checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; children: ReactNode;
}) {
  return <label className="ex-checkbox-row" data-disabled={disabled || undefined}>
    <input type="checkbox" checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)} />
    <span className="ex-checkbox-target" aria-hidden="true"><span className="ex-checkbox-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span></span>
    <span className="ex-checkbox-label">{children}</span>
  </label>;
}
