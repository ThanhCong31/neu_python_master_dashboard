import { LoadingState } from "@/shared/LoadingState";
import { StatusLabel } from "@/shared/StatusLabel";
export { Checkbox } from "@/components/expressive/checkbox";
import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Inbox, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/expressive/button";
import { IconButton } from "@/components/expressive/icon-button";

export function PageHeading({ eyebrow, title, description, action }: {
  eyebrow?: string; title: string; description?: string; action?: ReactNode;
}) {
  return <header className="sys-heading">
    <div>
      {eyebrow && <p className="sys-eyebrow">{eyebrow}</p>}
      <h2 className="sys-page-title">{title}</h2>
      {description && <p className="sys-description">{description}</p>}
    </div>
    {action && <div className="sys-heading-action">{action}</div>}
  </header>;
}
export function Section({ title, description, actions, children, className = "" }: {
  title: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string;
}) {
  return <section className={`sys-section ${className}`}>
    <div className="sys-section-head"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{actions}</div>
    {children}
  </section>;
}
export function State({ status, error, refreshError, retry, children, empty }: {
  status: "loading" | "ready" | "error";
  error?: string; refreshError?: string | null; retry?: () => void; children?: ReactNode; empty?: boolean;
}) {
  if (status === "loading") return <LoadingState label="Đang tải dữ liệu…"/>;
  if (status === "error") return <div className="sys-state" role="alert"><AlertCircle aria-hidden="true"/><div><strong>Không thể tải dữ liệu</strong><p>{error ?? "Vui lòng thử lại."}</p></div>{retry && <Button variant="outlined" onClick={retry} size="sm" icon={<RefreshCw/>}>Thử lại</Button>}</div>;
  if (empty) return <div className="sys-state"><Inbox aria-hidden="true"/>Chưa có bản ghi phù hợp.</div>;
  return <>{refreshError && <Notice error>{refreshError} {retry && <Button variant="outlined" size="xs" onClick={retry}>Thử lại</Button>}</Notice>}{children}</>;
}
export function Notice({ children, error = false, success = false }: { children: ReactNode; error?: boolean; success?: boolean }) {
  return <div className={`sys-notice ${error ? "sys-notice--error" : success ? "sys-notice--success" : ""}`} role={error ? "alert" : "status"}>
    {error ? <AlertCircle aria-hidden="true"/> : success ? <CheckCircle2 aria-hidden="true"/> : <AlertCircle aria-hidden="true"/>}<div>{children}</div>
  </div>;
}
export function Chip({ children, kind = "neutral" }: { children: ReactNode; kind?: "neutral" | "good" | "bad" | "accent" }) {
  return <StatusLabel tone={kind==="good"?"tertiary":kind==="bad"?"error":kind==="accent"?"primary":"neutral"}>{children}</StatusLabel>;
}
export function Metric({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return <div className="sys-metric"><p>{label}</p><strong>{value}</strong>{detail && <small>{detail}</small>}</div>;
}
export function formatNumber(n: number | null | undefined) { return typeof n === "number" && Number.isFinite(n) ? new Intl.NumberFormat("vi-VN").format(n) : "—"; }
export function formatDate(s: string | null | undefined) {
  if (!s) return "—";
  const date = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : `${s}Z`);
  return Number.isNaN(date.valueOf()) ? String(s) : new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(date);
}
export function textValue(v: unknown): string {
  if (v === undefined || v === null || v === "") return "—";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  return JSON.stringify(v);
}
export interface Column<Row> { key: string; heading: string; get: (row: Row) => ReactNode; className?: string; align?: "start" | "center" | "end" }
export function DataTable<Row>({ rows, columns, rowKey, emptyText = "Chưa có dữ liệu." }: {
  rows: Row[]; columns: Array<Column<Row>>; rowKey: (row: Row, index: number) => string | number; emptyText?: string;
}) {
  return <div className="sys-table-wrap" role="region" aria-label="Bảng dữ liệu, có thể cuộn ngang" tabIndex={0}><table className="sys-table"><thead><tr>{columns.map(c => <th key={c.key} scope="col" data-align={c.align} className={c.className}>{c.heading}</th>)}</tr></thead>
    <tbody>{rows.length ? rows.map((r,i) => <tr key={rowKey(r,i)}>{columns.map(c => <td data-align={c.align} className={c.className} key={c.key}>{c.get(r)}</td>)}</tr>)
      : <tr><td colSpan={columns.length} className="sys-table-empty">{emptyText}</td></tr>}</tbody></table></div>;
}
export function Pager({ page, total, pageSize, onPage }: { page: number; total: number; pageSize: number; onPage: (p: number) => void }) {
  if (!total) return null;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1,page),pages);
  const first = Math.max(1, Math.min(safePage - 2, pages - 4));
  const last = Math.min(pages, first + 4);
  const visible = Array.from({ length: last - first + 1 }, (_,i) => first + i);
  return <nav className="sys-pager" aria-label="Phân trang">
    <span>{formatNumber(total)} bản ghi · Trang {safePage}/{pages}</span>
    <div className="sys-actions sys-page-actions">
      <IconButton motion="standard" variant="standard" aria-label="Trang trước" onClick={() => onPage(safePage-1)} disabled={safePage<=1}><ChevronLeft aria-hidden="true"/></IconButton>
      {first > 1 && <><button className="sys-page-number" onClick={()=>onPage(1)} aria-label="Trang 1">1</button>{first > 2 && <span aria-hidden="true" className="sys-page-ellipsis">…</span>}</>}
      {visible.map(n => <button key={n} type="button" className={`sys-page-number${n===safePage ? " sys-page-number--current" : ""}`} aria-label={`Trang ${n}`} aria-current={n===safePage ? "page" : undefined} onClick={()=>onPage(n)}>{n}</button>)}
      {last < pages && <>{last < pages-1 && <span aria-hidden="true" className="sys-page-ellipsis">…</span>}<button className="sys-page-number" onClick={()=>onPage(pages)} aria-label={`Trang ${pages}`}>{pages}</button></>}
      <IconButton motion="standard" variant="standard" aria-label="Trang sau" onClick={() => onPage(safePage+1)} disabled={safePage>=pages}><ChevronRight aria-hidden="true"/></IconButton>
    </div>
  </nav>;
}
/** Native dialog: focus and Escape, but never dismiss a pending server mutation. */
export function Dialog({ title, description, children, onClose, width = "normal", dismissible = true }: { title: string; description?: string; children: ReactNode; onClose: () => void; width?: "normal" | "wide"; dismissible?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const userClosing = useRef(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const frame = requestAnimationFrame(() => { if (!node.open) node.showModal(); });
    return () => { cancelAnimationFrame(frame); userClosing.current = false; if (node.open) node.close(); };
  }, []);
  function requestClose() {
    if (!dismissible) return;
    userClosing.current = true;
    ref.current?.close();
  }
  return <dialog ref={ref}
    onCancel={(e) => { if (!dismissible) e.preventDefault(); else userClosing.current = true; }}
    onClose={() => { if (userClosing.current) { userClosing.current = false; onClose(); } }}
    className={`sys-dialog ${width === "wide" ? "sys-dialog--wide" : ""}`} aria-label={title} aria-busy={!dismissible}>
    <div className="sys-dialog-top"><div><h2>{title}</h2>{description && <p>{description}</p>}</div><IconButton type="button" variant="standard" motion="standard" aria-label="Đóng" disabled={!dismissible} onClick={requestClose}><X aria-hidden="true"/></IconButton></div>
    <div className="sys-dialog-content">{children}</div>
  </dialog>;
}
/** M3 secondary tabs with manual activation: focus by arrow, select by Enter/Space. */
export function Tabs<T extends string>({ options, value, onChange, label = "Chọn nội dung", panelId }: { options: Array<{value:T;label:string}>; value:T; onChange:(v:T)=>void; label?: string; panelId?: string }) {
  function keydown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (e.key === "ArrowRight") next = (index+1)%options.length;
    else if (e.key === "ArrowLeft") next = (index-1+options.length)%options.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = options.length-1;
    else return;
    e.preventDefault();
    const buttons = e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons?.[next]?.focus();
    buttons?.[next]?.scrollIntoView({block:"nearest",inline:"nearest"});
  }
  return <div className="sys-tabs" role="tablist" aria-label={label} aria-orientation="horizontal">
    {options.map((o,i) => <button key={o.value} id={`${panelId ?? "system-panel"}-tab-${o.value}`} type="button" role="tab"
      aria-selected={value===o.value} aria-controls={panelId} tabIndex={value===o.value ? 0 : -1}
      className={value===o.value ? "sys-tab sys-tab--active" : "sys-tab"}
      onKeyDown={event=>keydown(event,i)} onClick={()=>onChange(o.value)}>{o.label}</button>)}
  </div>;
}
export function FormField({ label, hint, children }: {label:string; hint?:string; children:ReactNode}) {
  return <label className="sys-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}
