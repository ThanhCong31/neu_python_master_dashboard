import { LoadingState } from "@/shared/LoadingState";
import { useId, useState, type ReactNode } from "react";
import { AlertCircle, Inbox, RefreshCw } from "lucide-react";
import { Button } from "@/components/expressive/button";
import { RichTooltip, TooltipProvider } from "@/components/expressive/tooltip";

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
  state, message, retry, children, label,
}: {
  state: "loading" | "error" | "ready";
  message?: string;
  label?: string;
  retry: () => void;
  children: ReactNode;
}) {
  if (state === "loading") return <LoadingState className="com-panel" label={label}/>;
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
type ChartSeries<Row> = { label: string; value: (row: Row) => number | null };
type ChartDetail = { label: string; value: string };

function barTone(index: number, negative: boolean, amount: number | null) {
  if (index === 1) return "com-bar--comparison";
  if (index === 2) return "com-bar--third";
  return negative && (amount ?? 0) < 0 ? "com-bar--negative" : "";
}

export function BarChart<Row extends ChartRow>({
  label, rows, value, format, negative = false, empty, comparison, third, stacked = false, tooltipDetails,
}: {
  label: string;
  rows: readonly Row[];
  value: (row: Row) => number | null;
  format: (value: number | null) => string;
  negative?: boolean;
  empty: ReactNode;
  comparison?: ChartSeries<Row>;
  third?: ChartSeries<Row>;
  stacked?: boolean;
  tooltipDetails?: (row: Row) => ChartDetail[];
}) {
  const [table, setTable] = useState(false);
  const chartId = useId();
  const series = [{ label, value }, ...(comparison ? [comparison] : []), ...(third ? [third] : [])];
  const chartRows = rows.map(row => ({
    row,
    amounts: series.map(item => item.value(row)),
  }));
  const sum = (amounts: (number | null)[]) => amounts.reduce<number>((total, amount) => total + (amount ?? 0), 0);
  const values = chartRows.flatMap(({ amounts }) => amounts).filter((amount): amount is number => typeof amount === "number" && Number.isFinite(amount));
  const min = negative ? Math.min(0, ...values) : 0;
  const max = Math.max(0, ...(stacked ? chartRows.map(({ amounts }) => sum(amounts)) : values));
  const span = max - min;
  const zero = span ? -min / span * 100 : 0;
  if (!values.length) return <Empty>{empty}</Empty>;

  const columns: Column<Row>[] = [
    { key: "channel", label: "Kênh", render: row => row.channel },
    ...series.map((item, index) => ({
      key: `series-${index}`, label: item.label, numeric: true, render: (row: Row) => format(item.value(row)),
    })),
  ];
  return <>
    <div className="com-chart-actions">
      <Button variant="text" size="xs" onClick={() => setTable(!table)}>{table ? "Biểu đồ" : "Bảng"}</Button>
    </div>
    {negative && !table && <ul className="com-roi-legend" aria-label="Chú giải ROI">
      <li><span className="bg-primary" aria-hidden="true"/>Doanh thu cao hơn ngân sách</li>
      <li><span className="bg-error" aria-hidden="true"/>Doanh thu thấp hơn ngân sách</li>
    </ul>}
    {series.length > 1 && <div className="com-chart-legend">
      {series.map((item, index) => <span key={item.label} className={`com-legend-${index}`}>● {item.label}　</span>)}
    </div>}
    {table ? <DataTable label={label} rows={rows} empty={empty} columns={columns}/> :
      <TooltipProvider delay={0} closeDelay={100}>
        <div className="com-bar-chart" role="list" aria-label={label}>
          {chartRows.map(({ row, amounts }, index) => {
            const seriesDetails = series.map((item, seriesIndex) => ({
              label: item.label,
              value: format(amounts[seriesIndex]),
              tone: barTone(seriesIndex, negative, amounts[seriesIndex]),
            }));
            const details: (ChartDetail & { tone?: string })[] = [...seriesDetails, ...(tooltipDetails?.(row) ?? [])];
            const descriptionId = `${chartId}-${index}`;
            return <div className="com-bar-row" role="listitem" key={`${row.channel}-${index}`}>
              <span>{row.channel}</span>
              <RichTooltip side="top" motion="none" className="com-chart-tooltip" content={<>
                <div className="com-chart-tooltip-title">{row.channel}</div>
                <dl className="com-chart-tooltip-values">
                  {details.map(detail => <div key={detail.label}>
                    <dt>
                      {detail.tone !== undefined && <span className={`com-bar com-chart-tooltip-marker ${detail.tone}`} aria-hidden="true"/>}
                      {detail.label}
                    </dt>
                    <dd>{detail.value}</dd>
                  </div>)}
                </dl>
              </>}>
                <div role="group" aria-label={row.channel} aria-describedby={descriptionId} tabIndex={0} className={`focus-ring rounded-shape-full${stacked ? " com-stack-track" : ""}`}>
                  {series.map((item, seriesIndex) => {
                    const amount = amounts[seriesIndex];
                    const width = span && amount !== null ? Math.abs(amount) / span * 100 : 0;
                    const barStyle = stacked ? { width: "100%" } : {
                      width: `${width}%`,
                      ...(negative ? { position: "absolute" as const, left: `${(amount ?? 0) < 0 ? zero - width : zero}%` } : {}),
                    };
                    return <div aria-hidden="true" key={item.label}
                      className={stacked ? "com-stack-segment" : `com-bar-track${negative ? " com-bar-track--signed" : ""}`}
                      style={stacked ? { width: `${width}%` } : undefined}>
                      <i className={`com-bar ${seriesDetails[seriesIndex].tone}`} style={barStyle}/>
                      {negative && <b className="com-zero-line" style={{ left: `${zero}%` }}/>}
                    </div>;
                  })}
                </div>
              </RichTooltip>
              <span hidden id={descriptionId}>{details.map(detail => `${detail.label}: ${detail.value}`).join(". ")}</span>
              <strong>{stacked ? format(sum(amounts)) : seriesDetails.map(detail =>
                <span className="com-bar-value" key={detail.label}>{detail.value}</span>,
              )}</strong>
            </div>;
          })}
        </div>
      </TooltipProvider>}
  </>;
}
