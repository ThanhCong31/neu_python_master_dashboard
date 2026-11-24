import { ToggleGroup } from '@base-ui/react/toggle-group';
import type { ComponentProps, ReactNode } from 'react';
import { ToggleButton } from './button';
import './view-switch.css';

/** Action group: intentionally no width-morphing in dashboard toolbars. */
export function ButtonGroup({ children, label }: { children: ReactNode; label: string }) {
  return <div className="ex-connected-actions" role="group" aria-label={label}>{children}</div>;
}

/** Registry-inspired connected exclusive group, preserving local V25 geometry and stable bounds. */
export function ConnectedButtonGroup({ className, onValueChange, ...props }: Omit<ToggleGroup.Props, "className"> & {className?: string}) {
  return <ToggleGroup {...props} className={`ex-view-switch${typeof className === 'string' ? ` ${className}` : ''}`}
    onValueChange={(next, details) => {
      if (!props.multiple && next.length === 0) { details.cancel(); return; }
      onValueChange?.(next, details);
    }}/>;
}
export function ConnectedButton(props: ComponentProps<typeof ToggleButton>) {
  return <ToggleButton variant="tonal" motion="standard" {...props}/>;
}
