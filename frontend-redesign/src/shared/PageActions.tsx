import { createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { RefreshCw } from 'lucide-react';
import { IconButton } from '@/components/expressive/icon-button';
import { Tooltip } from '@/components/expressive/tooltip';

/** The Shell owns the location; each screen owns its request lifecycle. */
export const PageActionsContext = createContext<HTMLDivElement | null>(null);

type RefreshProps = { onRefresh: () => void; busy?: boolean; disabled?: boolean; label?: string };
export function RefreshButton({ onRefresh, busy = false, disabled = false, label = 'Làm mới dữ liệu' }: RefreshProps) {
  return <Tooltip content={busy ? 'Đang làm mới…' : label} side="bottom">
    <IconButton type="button" variant="standard" motion="standard" size="sm" className="min-h-12 min-w-12" aria-label={busy ? 'Đang làm mới dữ liệu' : label} aria-busy={busy} disabled={busy || disabled} onClick={onRefresh}>
      <RefreshCw aria-hidden="true" className={busy ? 'motion-safe:animate-spin' : undefined}/>
    </IconButton>
  </Tooltip>;
}

/** Render one page-wide refresh in the app bar. Do not use for writes/ETL. */
export function PageRefresh(props: RefreshProps) {
  const target = useContext(PageActionsContext);
  return target ? createPortal(<RefreshButton {...props}/>, target) : null;
}
