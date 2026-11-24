import { ConnectedButtonGroup, ConnectedButton } from './button-group';

type Option<T extends string> = { value: T; label: string };

/** Exclusive view selection, using the existing Expressive toggle and connected geometry. */
export function ViewSwitch<T extends string>({ label, value, options, onChange, compact = false }: {
  compact?: boolean;
  label: string;
  value: T;
  options: readonly [Option<T>, Option<T>];
  onChange: (value: T) => void;
}) {
  return (
    <ConnectedButtonGroup
      className={compact ? "ex-view-switch-compact" : undefined}
      aria-label={label}
      value={[value]}
      onValueChange={(next, details) => {
        const selected = options.find(option => option.value === next[0]);
        if (!selected) { details.cancel(); return; }
        if (selected.value !== value) onChange(selected.value);
      }}
    >
      {options.map(option => (
        <ConnectedButton key={option.value} value={option.value}>
          <span className="ex-view-switch-label">{option.label}</span>
        </ConnectedButton>
      ))}
    </ConnectedButtonGroup>
  );
}
