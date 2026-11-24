import { X } from 'lucide-react';
import './workspace-controls.css';

/** Input chip, not a toggle: label plus an explicitly named remove action. */
export function InputChip({ label, removeLabel, onRemove, title }: {
  label: string; removeLabel: string; onRemove: () => void; title?: string;
}) {
  return <span className="ex-input-chip" title={title} data-slot="input-chip">
    <span className="ex-input-chip-label">{label}</span>
    <button type="button" className="state-layer focus-ring ex-input-chip-remove" aria-label={removeLabel} onClick={onRemove}
      onKeyDown={e => { if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); onRemove(); } }}><X size={18} aria-hidden="true"/></button>
  </span>;
}
