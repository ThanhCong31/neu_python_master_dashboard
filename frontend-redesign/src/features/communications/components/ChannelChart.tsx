import { ChartBoundary } from '@/shared/charts/ChartBoundary';
import { lazy, Suspense, useState } from 'react';
import { Button } from '@/components/expressive/button';
import { LoadingState } from '@/shared/LoadingState';
import { AnalysisTable, type AnalysisColumn } from '@/shared/AnalysisTable';
import { chartBase, type ChartPalette } from '@/shared/charts/theme';
import { groupLabelWidth } from '@/shared/charts/chart-style';
import type { ChartLayout } from '@/shared/charts/responsive';
import { numberText } from '@/shared/format';
const Chart = lazy(() => import('@/shared/charts/Chart'));

type Series<Row> = { label: string; value: (row: Row) => number | null | undefined };
type Detail = { label: string; value: string };
const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const escape = (value: unknown) =>
  String(value ?? '—').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  );

/** Feature-specific configuration for the shared ECharts host, not a second renderer. */
export function ChannelChart<Row extends { channel: string | null }>({
  title,
  description,
  rows,
  series,
  format = numberText,
  axisFormat = format,
  signed = false,
  stacked = false,
  valid = true,
  extraColumns = [],
  tooltipDetails,
  empty = 'Không có dữ liệu trong phạm vi này.',
}: {
  title: string;
  description?: string;
  rows: readonly Row[];
  series: readonly Series<Row>[];
  format?: (v: number | null | undefined) => string;
  axisFormat?: (v: number | null | undefined) => string;
  signed?: boolean;
  stacked?: boolean;
  valid?: boolean;
  extraColumns?: readonly AnalysisColumn<Row>[];
  tooltipDetails?: (row: Row) => Detail[];
  empty?: string;
}) {
  const [table, setTable] = useState(false);
  const names = rows.map((row) => row.channel || 'Chưa xác định');
  const values = rows.flatMap((row) => series.map((s) => s.value(row)));
  const good = valid && values.every((v) => v == null || (finite(v) && (signed || v >= 0)));
  const chartable = good && values.some(finite);
  const columns: AnalysisColumn<Row>[] = [
    { key: 'channel', label: 'Kênh', render: (row) => row.channel || 'Chưa xác định' },
    ...series.map((s, i) => ({
      key: `series-${i}`,
      label: s.label,
      numeric: true,
      render: (row: Row) => format(s.value(row)),
    })),
    ...extraColumns,
  ];
  const height = Math.max(
    160,
    rows.length * (stacked ? 30 : Math.max(30, series.length * 18)) + 42,
  );
  const makeOption = (p: ChartPalette, l: ChartLayout) => ({
    legend: series.length > 1 ? {} : undefined,
    grid: { left: 2, right: 14, top: 12, bottom: 12, containLabel: true },
    tooltip: {
      ...chartBase(p, true, l).tooltip,
      valueFormatter: (v: unknown) => format(finite(v) ? v : null),
      ...(tooltipDetails
        ? {
            formatter: (params: unknown) => {
              const points = Array.isArray(params) ? params : [params];
              const first = points[0] as { dataIndex?: number } | undefined;
              const row = typeof first?.dataIndex === 'number' ? rows[first.dataIndex] : undefined;
              if (!row) return '';
              const shown = new Set(
                points.map((point) => (point as { seriesName?: string })?.seriesName),
              );
              return [
                escape(row.channel || 'Chưa xác định'),
                ...series
                  .filter((s) => shown.has(s.label))
                  .map((s) => `${escape(s.label)}: ${escape(format(s.value(row)))}`),
                ...tooltipDetails(row).map((d) => `${escape(d.label)}: ${escape(d.value)}`),
              ].join('<br>');
            },
          }
        : {}),
    },
    xAxis: {
      type: 'value',
      ...(signed ? {} : { min: 0 }),
      splitNumber: l.compact ? 3 : 5,
      axisLabel: { formatter: (v: number) => axisFormat(v) },
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: names,
      axisLabel: { width: groupLabelWidth(l), overflow: 'truncate' },
    },
    series: series.map((s, i) => ({
      name: s.label,
      type: 'bar',
      ...(stacked ? { stack: 'channel' } : {}),
      barMaxWidth: 24,
      itemStyle: { color: [p.primary, p.tertiary, p.onSecondaryContainer][i % 3] },
      data: rows.map((row) => {
        const value = s.value(row);
        return finite(value)
          ? signed && value < 0
            ? { value, itemStyle: { color: p.error } }
            : value
          : null;
      }),
    })),
  });
  return (
    <section className="com-chart-card">
      <div className="com-panel-head">
        <div>
          <h2>{title}</h2>
          {description && <p className="dw-note">{description}</p>}
        </div>
        {chartable && (
          <Button
            motion="standard"
            variant="text"
            onClick={() => setTable((v) => !v)}
            aria-pressed={table}
          >
            {table ? 'Biểu đồ' : 'Bảng số liệu'}
          </Button>
        )}
      </div>
      {!good && (
        <p className="dw-error" role="alert">
          Số liệu không hợp lệ cho biểu đồ; hiển thị bảng nguồn.
        </p>
      )}
      {!rows.length ? (
        <p className="dw-note">{empty}</p>
      ) : table || !chartable ? (
        <AnalysisTable label={title} rows={rows} columns={columns} empty={empty} />
      ) : (
        <ChartBoundary>
          <Suspense
            fallback={
              <LoadingState
                label="Đang tải biểu đồ…"
                chartHeight={height}
                compactChartHeight={height}
              />
            }
          >
            <Chart label={title} makeOption={makeOption} height={height} compactHeight={height} />
          </Suspense>
        </ChartBoundary>
      )}
    </section>
  );
}
