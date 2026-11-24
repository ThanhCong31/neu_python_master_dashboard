import { useState, type ReactNode } from "react";
import { AlertCircle, Inbox, RefreshCw } from "lucide-react";
import { Button } from "@/components/expressive/button";

export function formatNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? new Intl.NumberFormat("vi-VN").format(value)
    : "—";
}

export function formatMoney(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value)
    : "—";
}

export function formatPercent(value: number | null | undefined, signed = false) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  const result = new Intl.NumberFormat("vi-VN", { style: "percent", maximumFractionDigits: 1 }).format(value);
  return signed && value > 0 ? `+${result}` : result;
}

export function Metric({ label, value, detail }: { label: string; value: ReactNode; detail?: ReactNode }) {
  return <div className="com-metric"><p>{label}</p><strong>{value}</strong>{detail && <small>{detail}</small>}</div>;
}

export function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <section className="com-panel"><div className="com-panel-head"><div><h2>{title}</h2>{description && <p>{description}</p>}</div></div>{children}</section>;
}

export function LoadState({
  state, message, retry, children,
}: {
  state: "loading" | "error" | "ready";
  message?: string;
  retry: () => void;
  children: ReactNode;
}) {
  if (state === "loading") return <div className="com-loading" role="status" aria-label="Đang tải dữ liệu"><i/><i/><i/><span className="sr-only">Đang tải dữ liệu…</span></div>;
  if (state === "error") return <div className="com-state" role="alert"><AlertCircle aria-hidden="true"/><div><strong>Không thể tải dữ liệu</strong><p>{message ?? "Vui lòng thử lại."}</p></div><Button variant="outlined" size="sm" icon={<RefreshCw/>} onClick={retry}>Thử lại</Button></div>;
  return <>{children}</>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="com-empty"><Inbox aria-hidden="true"/><p>{children}</p></div>;
}

export interface Column<Row> { key: string; label: string; render: (row: Row) => ReactNode; numeric?: boolean; }
export function DataTable<Row>({ label, rows, columns, empty }: { label: string; rows: readonly Row[]; columns: Column<Row>[]; empty: ReactNode }) {
  return <div className="com-table-wrap" role="region" aria-label={label} tabIndex={0}><table className="com-table"><thead><tr>{columns.map((column) => <th key={column.key} scope="col" className={column.numeric ? "com-number" : undefined}>{column.label}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={index}>{columns.map((column) => <td key={column.key} className={column.numeric ? "com-number" : undefined}>{column.render(row)}</td>)}</tr>) : <tr><td colSpan={columns.length}><Empty>{empty}</Empty></td></tr>}</tbody></table></div>;
}

export function ChartCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <section className="com-chart-card"><header><h2>{title}</h2>{description && <p>{description}</p>}</header>{children}</section>;
}

type ChartRow = { channel: string };
type ChartSeries = { label: string; value: (row: ChartRow) => number | null };
export function BarChart({ label, rows, value, format, negative = false, empty, comparison, third, stacked = false }: { label: string; rows: readonly ChartRow[]; value: (row: ChartRow) => number | null; format: (value: number | null) => string; negative?: boolean; empty: ReactNode; comparison?: ChartSeries; third?: ChartSeries; stacked?: boolean }) {
  const [table, setTable] = useState(false);
  const series: ChartSeries[] = [{ label, value }, ...(comparison ? [comparison] : []), ...(third ? [third] : [])];
  const values = rows.flatMap(row => series.map(item => item.value(row))).filter((item): item is number => typeof item === "number" && Number.isFinite(item));
  const min = negative ? Math.min(0, ...values) : 0;
  const max = Math.max(0, ...(stacked ? rows.map(row => series.reduce((sum, item) => sum + (item.value(row) ?? 0), 0)) : values));
  const span = max - min;
  if (!rows.length || !values.length) return <Empty>{empty}</Empty>;
  const columns: Column<ChartRow>[] = [{key:"channel",label:"Kênh",render:row=>row.channel}, ...series.map((item,index)=>({key:`series-${index}`,label:item.label,numeric:true,render:(row:ChartRow)=>format(item.value(row))}))];
  return <><div className="com-chart-actions"><Button variant="text" size="xs" onClick={() => setTable(!table)}>{table ? "Biểu đồ" : "Bảng"}</Button></div>{series.length > 1 && <div className="com-chart-legend">{series.map((item,index)=><span key={item.label} className={`com-legend-${index}`}>● {item.label}　</span>)}</div>}{table ? <DataTable label={label} rows={rows} empty={empty} columns={columns}/> : <div className="com-bar-chart" role="list" aria-label={label}>{rows.map((row,index)=><div className="com-bar-row" role="listitem" key={`${row.channel}-${index}`}><span title={row.channel}>{row.channel}</span><div className={stacked ? "com-stack-track" : undefined}>{series.map((item,i)=>{const amount=item.value(row); const width=span && amount!=null ? Math.abs(amount)/span*100 : 0; const zero=span ? -min/span*100 : 0; return <div className={stacked ? "com-stack-segment" : `com-bar-track${negative ? " com-bar-track--signed" : ""}`} key={item.label} style={stacked ? {width:`${width}%`} : undefined}><i className={`com-bar ${i===1?"com-bar--comparison":i===2?"com-bar--third":negative&&(amount??0)<0?"com-bar--negative":""}`} style={stacked ? {width:"100%"} : {width:`${width}%`, ...(negative ? {position:"absolute",left:`${amount!=null && amount<0 ? zero-width : zero}%`} : {})}}/>{negative && <b className="com-zero-line" style={{left:`${zero}%`}}/>}</div>;})}</div><strong>{stacked ? format(series.reduce((sum,item)=>sum+(item.value(row)??0),0)) : series.map(item=><span className="com-bar-value" key={item.label}>{format(item.value(row))}</span>)}</strong></div>)}</div>}</>;
}
