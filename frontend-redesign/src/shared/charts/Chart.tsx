import { useEffect, useMemo, useRef, useState } from 'react';
import { init, use, type EChartsCoreOption } from 'echarts/core';
import { LineChart, BarChart, ScatterChart, BoxplotChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  AriaComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useReducedMotion } from '@/lib/expressive/use-reduced-motion';
import { useChartPalette, chartBase, type ChartPalette } from './theme';
import { chartLayoutForWidth, type ChartLayout } from './responsive';
import { styleSeries, styleAxis, isCategoryAxis, type PlotSeries } from './chart-style';
import { ChartLegend } from './ChartLegend';
use([
  LineChart,
  BarChart,
  ScatterChart,
  BoxplotChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  AriaComponent,
  CanvasRenderer,
]);
/** Owns ECharts lifecycle. The caller owns semantics, data, and an equivalent HTML table. */
export default function Chart({
  label,
  makeOption,
  height = 300,
  compactHeight = height,
}: {
  label: string;
  makeOption: (palette: ChartPalette, layout: ChartLayout) => EChartsCoreOption;
  height?: number;
  compactHeight?: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const chart = useRef<ReturnType<typeof init> | null>(null);
  const hasRendered = useRef(false);
  const [error, setError] = useState(false);
  const [layout, setLayout] = useState<ChartLayout | null>(null);
  const palette = useChartPalette();
  const reduced = useReducedMotion();
  const option = useMemo(
    () => (layout ? makeOption(palette, layout) : null),
    [palette, layout, makeOption],
  );
  const series = (option && Array.isArray(option.series) ? option.series : []) as PlotSeries[];
  // Reset hidden selections when the chart or series set changes (e.g. filter/dataset).
  const legendKey = JSON.stringify([label, series.map((s) => s.name)]);
  const [selection, setSelection] = useState<{ key: string; hidden: number[] }>({
    key: '',
    hidden: [],
  });
  const hidden = selection.key === legendKey ? selection.hidden : [];
  const showLegend = !!option?.legend && series.length > 0;
  useEffect(() => {
    setSelection((prev) =>
      prev.key === legendKey || !prev.hidden.length ? prev : { key: legendKey, hidden: [] },
    );
  }, [legendKey]);
  const toggle = (i: number) =>
    setSelection((prev) => {
      const old = prev.key === legendKey ? prev.hidden : [];
      return {
        key: legendKey,
        hidden: old.includes(i)
          ? old.filter((n) => n !== i)
          : old.length < series.length - 1
            ? [...old, i]
            : old,
      };
    });

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let mounted = true;
    let lastWidth = 0,
      lastHeight = 0;
    const measure = () => {
      if (!mounted) return;
      const width = el.clientWidth,
        height = el.clientHeight;
      if (width <= 0 || height <= 0) return; // wait for a measurable host
      try {
        if (!chart.current) chart.current = init(el, undefined, { renderer: 'canvas' });
        else if (width !== lastWidth || height !== lastHeight) chart.current.resize();
        lastWidth = width;
        lastHeight = height;
        const next = chartLayoutForWidth(width);
        setLayout((previous) => (previous?.tier === next.tier ? previous : next));
      } catch {
        setError(true);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    void document.fonts.ready
      .then(() => {
        if (mounted && chart.current && !chart.current.isDisposed()) chart.current.resize();
      })
      .catch(() => {});
    return () => {
      mounted = false;
      observer.disconnect();
      chart.current?.dispose();
      chart.current = null;
      hasRendered.current = false;
    };
  }, []);
  useEffect(() => {
    if (!layout || !option || !chart.current) return;
    try {
      const { legend, series: raw, ...rest } = option;
      const active = series.filter((_, i) => !showLegend || !hidden.includes(i));
      const horizontal = isCategoryAxis(rest.yAxis);
      const styled = styleSeries(active, horizontal);
      chart.current.setOption(
        {
          ...chartBase(palette, reduced, layout),
          ...rest,
          // No entrance replay on legend toggles, theme changes or container resize.
          animation: !reduced && !hasRendered.current,
          // The HTML legend wraps independently, so it cannot collide with the plot.
          grid: legend && rest.grid ? { ...rest.grid, top: 12 } : rest.grid,
          xAxis: styleAxis(rest.xAxis, layout, palette),
          yAxis: styleAxis(rest.yAxis, layout, palette),
          series: Array.isArray(raw) ? styled : raw,
        },
        { notMerge: true },
      );
      hasRendered.current = true;
      setError(false);
    } catch {
      setError(true);
    }
  }, [palette, reduced, option, layout, selection]);
  return (
    <div className="dashboard-chart-frame" data-error={error || undefined}>
      {showLegend && !error && <ChartLegend series={series} hidden={hidden} onToggle={toggle} />}{' '}
      {error && (
        <p role="alert" className="dashboard-chart-error">
          Không hiển thị được biểu đồ. Chọn “Bảng số liệu” để xem dữ liệu.
        </p>
      )}
      <div
        className="dashboard-chart-host"
        ref={host}
        role="img"
        aria-label={label}
        style={{
          height: layout?.compact ? compactHeight : height,
          width: '100%',
          minWidth: 0,
          visibility: error ? 'hidden' : undefined,
        }}
      />
    </div>
  );
}
