import { ChartBoundary } from '@/shared/charts/ChartBoundary';
import { lazy, Suspense } from 'react';
import { LoadingState } from '@/shared/LoadingState';
import { groupLabelWidth } from '@/shared/charts/chart-style';
import type { ChartLayout } from '@/shared/charts/responsive';
import type { ChartPalette } from '@/shared/charts/theme';
import { numberText } from '@/shared/format';
const Chart = lazy(() => import('@/shared/charts/Chart'));

export type SourceRow = { label: string; source: string; count: number };
export const validSourceRows = (rows: SourceRow[]) =>
  rows.every(
    (row) =>
      typeof row.label === 'string' &&
      typeof row.source === 'string' &&
      Number.isSafeInteger(row.count) &&
      row.count >= 0,
  );
export function SourceDistribution({
  title,
  rows,
  labels,
}: {
  title: string;
  rows: SourceRow[];
  labels: string[];
}) {
  const sources = [...new Set(rows.map((r) => r.source))].sort((a, b) => a.localeCompare(b, 'vi'));
  const counts = new Map<string, Map<string, number>>();
  for (const row of rows) {
    const source = counts.get(row.source) ?? new Map<string, number>();
    source.set(row.label, (source.get(row.label) ?? 0) + row.count);
    counts.set(row.source, source);
  }
  const height = Math.max(180, labels.length * 32 + 40);
  const makeOption = (p: ChartPalette, l: ChartLayout) => ({
    legend: sources.length > 1 ? {} : undefined,
    grid: { left: 2, right: 14, top: 12, bottom: 12, containLabel: true },
    xAxis: {
      type: 'value',
      min: 0,
      minInterval: 1,
      splitNumber: l.compact ? 3 : 5,
      axisLabel: { formatter: (v: number) => numberText(v) },
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: labels,
      axisLabel: { width: groupLabelWidth(l), overflow: 'truncate' },
    },
    series: sources.map((source, i) => ({
      name: source || 'Chưa xác định',
      type: 'bar',
      stack: 'source',
      barMaxWidth: 24,
      itemStyle: {
        color: [p.primary, p.tertiary, p.secondary, p.onSecondaryContainer, p.outline, p.text][
          i % 6
        ],
      },
      data: labels.map((label) => counts.get(source)?.get(label) ?? 0),
    })),
  });
  if (!rows.length) return <p className="sys-muted">Không có dữ liệu trong phạm vi này.</p>;
  return (
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
  );
}
