import {
  MatrixAnalysisTable,
  type MatrixTableProps,
  admissionsAnalysisCell,
} from '@/shared/AnalysisTable';
import { ChartBoundary } from '@/shared/charts/ChartBoundary';
import { LoadingState } from '@/shared/LoadingState';
import { WorkspaceSelect } from '@/shared/WorkspaceSelect';
import { lazy, Suspense, useState } from 'react';
import { Button } from '@/components/expressive/button';
import type { useResource } from '@/services/useResource';
import { numberText, percentText } from '@/shared/format';
import type { EChartsCoreOption } from 'echarts/core';
import type { ChartPalette } from '@/shared/charts/theme';
import {
  groupLabelWidth,
  chartTickBudget,
  resultRole,
  sourceRole,
} from '@/shared/charts/chart-style';
import { categoryTickIndices, type ChartLayout } from '@/shared/charts/responsive';
import {
  countsValid,
  dimensions,
  groupLabel,
  resultLabel,
  type Summary,
  type Dimension,
  type LeadOptions,
  type Filters,
} from '../model';
import { exactGroupFilter, split } from '../query';
import { resultCounts, weekSeries } from '../analytics';
const Chart = lazy(() => import('@/shared/charts/Chart'));

const numericHeaders = new Set([
  'Đăng ký',
  'Đã đóng phí',
  'Liên hệ',
  'Tỷ lệ đóng phí / ĐK',
  'Doanh thu',
  'Số hồ sơ có cờ',
  'Dòng',
  'Lượt hỏi',
  'Tỷ lệ trong nhóm có số liệu',
]);
function DataTable(props: MatrixTableProps) {
  return (
    <MatrixAnalysisTable
      {...props}
      numericHeaders={numericHeaders}
      containerClassName="ld-analysis-table ld-table-scroll focus-ring"
      tableClassName="ld-table"
      formatBody={admissionsAnalysisCell}
    />
  );
}
const legend = (p: ChartPalette) => ({
  type: 'scroll',
  top: 0,
  left: 0,
  right: 0,
  textStyle: { color: p.text, fontSize: 12 },
  pageTextStyle: { color: p.text },
  pageIconColor: p.primary,
  pageIconInactiveColor: p.grid,
});
const valueAxis = (p: ChartPalette, l: ChartLayout) => ({
  type: 'value',
  min: 0,
  minInterval: 1,
  splitNumber: l.compact ? 3 : 5,
  axisLabel: { color: p.muted },
  splitLine: { lineStyle: { color: p.grid } },
});
function ChartView({
  label,
  makeOption,
  height = 300,
}: {
  label: string;
  makeOption: (p: ChartPalette, l: ChartLayout) => EChartsCoreOption;
  height?: number;
}) {
  return (
    <ChartBoundary className="ld-error">
      <Suspense
        fallback={
          <LoadingState
            label="Đang tải biểu đồ…"
            chartHeight={height}
            compactChartHeight={Math.max(240, height - 30)}
          />
        }
      >
        <Chart
          label={label}
          makeOption={makeOption}
          height={height}
          compactHeight={Math.max(240, height - 30)}
        />
      </Suspense>
    </ChartBoundary>
  );
}
function Reconciliation({
  data,
  options,
  filters,
  onGroup,
}: {
  data: Summary;
  options?: LeadOptions;
  filters: Filters;
  onGroup: (patch: Filters) => void;
}) {
  const [table, setTable] = useState(false);
  const { valid, groups } = resultCounts(data.kpi, data.by_source_result);
  const sources = [...new Set(data.by_source_result.map((r) => r.source))];
  const results = [...new Set(data.by_source_result.map((r) => r.result))].sort((a, b) =>
    String(a).localeCompare(String(b), 'vi'),
  );
  const chartable =
    valid &&
    sources.length > 0 &&
    sources.length <= 6 &&
    results.length <= 4 &&
    new Set(results.map(resultRole)).size === results.length &&
    sources.every((s) => (s ?? '').length <= 35) &&
    results.every((s) => (s ?? '').length <= 40);
  const makeOption = (p: ChartPalette, l: ChartLayout) => ({
    grid: { left: 2, right: 18, top: 45, bottom: 10, containLabel: true },
    legend: legend(p),
    xAxis: valueAxis(p, l),
    yAxis: {
      type: 'category',
      inverse: true,
      data: sources.map(groupLabel),
      axisLabel: { color: p.muted, width: groupLabelWidth(l), overflow: 'truncate' },
      axisTick: { show: false },
    },
    series: results.map((r) => ({
      name: r === null ? 'Chưa có kết quả (null)' : r === '' ? 'Kết quả rỗng' : resultLabel(r),
      type: 'bar',
      stack: 'result',
      barMaxWidth: 28,
      itemStyle: { color: p[resultRole(r)] },
      data: sources.map((s) =>
        data.by_source_result
          .filter((x) => x.source === s && x.result === r)
          .reduce((a, x) => a + x.count, 0),
      ),
    })),
  });
  return (
    <section className="ld-panel">
      <div className="ld-panel-head">
        <div>
          <h2>Kết quả làm sạch theo nguồn</h2>
          <p className="ld-note">Phân loại dòng biểu mẫu, không phải phễu chuyển đổi.</p>
        </div>
        {chartable && (
          <Button motion="standard" variant="text" onClick={() => setTable((v) => !v)}>
            {table ? 'Biểu đồ' : 'Bảng số liệu'}
          </Button>
        )}
      </div>
      {groups.map((g, i) => (
        <div className="ld-result-row" key={g.label}>
          <div>
            <span>{resultLabel(g.label)}</span>
            <strong>
              {numberText(g.count)} ·{' '}
              {percentText(valid && data.kpi.total ? g.count / data.kpi.total : null)}
            </strong>
          </div>
          {valid && (
            <div className="ld-track">
              <div
                data-stage={i}
                style={{ width: `${data.kpi.total ? (g.count / data.kpi.total) * 100 : 0}%` }}
              />
            </div>
          )}
        </div>
      ))}
      {!valid && (
        <p className="ld-error" role="alert">
          Số liệu đối soát không khớp tổng dòng. Hiển thị dữ liệu nguồn thay vì vẽ biểu đồ.
        </p>
      )}
      {chartable && !table ? (
        <ChartView
          label="Kết quả đối soát theo nguồn"
          makeOption={makeOption}
          height={Math.max(220, sources.length * 42 + 48)}
        />
      ) : (
        <DataTable
          headers={['Nguồn', 'Kết quả', 'Dòng', 'Chi tiết']}
          rows={data.by_source_result.map((r) => {
            const source = exactGroupFilter('by_source', r.source, options, filters);
            const result = r.result;
            const allowed =
              !!result &&
              !result.includes(',') &&
              options?.result.includes(result) &&
              (!split(filters.result).length || split(filters.result).includes(result));
            return [
              groupLabel(r.source),
              resultLabel(result),
              r.count,
              source && allowed ? (
                <Button
                  motion="standard"
                  variant="text"
                  onClick={() => onGroup({ source: source.value, result: result! })}
                >
                  Xem lead
                </Button>
              ) : (
                '—'
              ),
            ];
          })}
        />
      )}
    </section>
  );
}
function Weekly({ data }: { data: Summary }) {
  const [table, setTable] = useState(false);
  const w = weekSeries(data.weekly, data.kpi.total);
  const chartable =
    w.valid &&
    w.weeks.length > 0 &&
    w.sources.length <= 4 &&
    new Set(w.sources.map((s, i) => sourceRole(s, i))).size === w.sources.length;
  const makeOption = (p: ChartPalette, l: ChartLayout) => {
    const ticks = categoryTickIndices(w.weeks.length, chartTickBudget(l, l.compact ? 6 : 8));
    return {
      grid: { left: 2, right: 14, top: 45, bottom: 12, containLabel: true },
      legend: legend(p),
      xAxis: {
        type: 'category',
        data: w.weeks,
        axisLabel: {
          color: p.muted,
          fontSize: l.compact ? 10 : 12,
          interval: (i: number) => ticks.has(i),
          formatter: (s: string) => (l.compact ? s.slice(2) : s),
          hideOverlap: true,
        },
        axisTick: { show: false },
      },
      yAxis: valueAxis(p, l),
      series: w.sources.map((s, i) => ({
        name: groupLabel(s),
        type: 'bar',
        stack: 'week',
        data: w.values(s),
        itemStyle: { color: p[sourceRole(s, i)] },
        barMaxWidth: 30,
      })),
    };
  };
  return (
    <section className="ld-panel">
      <div className="ld-panel-head">
        <div>
          <h2>Lead theo tuần</h2>
          <p className="ld-note">Tuần ISO theo ngày gửi ghi nhận trong dữ liệu.</p>
        </div>
        {chartable && (
          <Button motion="standard" variant="text" onClick={() => setTable((v) => !v)}>
            {table ? 'Biểu đồ' : 'Bảng số liệu'}
          </Button>
        )}
      </div>
      {!w.valid && (
        <p className="ld-error" role="alert">
          Tổng hoặc mã tuần không hợp lệ. Chỉ hiển thị số liệu nguồn.
        </p>
      )}
      {!data.weekly.length ? (
        <p className="ld-note">Không có dòng có tuần ghi nhận.</p>
      ) : chartable && !table ? (
        <ChartView label="Dòng lead theo tuần ISO và nguồn" makeOption={makeOption} />
      ) : (
        <DataTable
          headers={['Tuần ISO', 'Nguồn', 'Dòng']}
          rows={data.weekly.map((r) => [r.week, groupLabel(r.source), r.count])}
        />
      )}
      {w.limited && (
        <p className="ld-note">
          Biểu đồ chỉ hiển thị 52 tuần cuối trong khoảng dữ liệu; bảng có đầy đủ các tuần ghi nhận.
        </p>
      )}
      {w.missing !== null && w.missing > 0 && (
        <p className="ld-note">
          {numberText(w.missing)} dòng không có tuần trong kết quả; KPI vẫn tính các dòng này.
        </p>
      )}
      <p className="ld-note">
        Một số luồng ETL có thể bổ sung ngày khi thiếu timestamp; API không có cờ xác định từng
        dòng.
      </p>
    </section>
  );
}
function Grouping({
  data,
  options,
  filters,
  onGroup,
  canViewPii,
}: {
  canViewPii: boolean;
  data: Summary;
  options?: LeadOptions;
  filters: Filters;
  onGroup: (patch: Filters) => void;
}) {
  const [selection, setDimension] = useState<Dimension | 'by_question'>('by_source');
  const dimension = !canViewPii && selection === 'by_question' ? 'by_source' : selection;
  const faq = dimension === 'by_question';
  const [table, setTable] = useState(false);
  const rows = [...(data[dimension] ?? [])].sort((a, b) => b.count - a.count);
  const top = rows.slice(0, 10);
  const total = rows.reduce((a, b) => a + b.count, 0);
  const valid =
    countsValid(total, data.kpi.total) &&
    total <= data.kpi.total &&
    rows.every((r) => countsValid(r.count));
  const makeOption = (p: ChartPalette, l: ChartLayout) => ({
    grid: { left: 2, right: 18, top: 12, bottom: 12, containLabel: true },
    xAxis: valueAxis(p, l),
    yAxis: {
      type: 'category',
      inverse: true,
      data: top.map((r) => groupLabel(r.key)),
      axisLabel: { color: p.muted, width: groupLabelWidth(l), overflow: 'truncate' },
      axisTick: { show: false },
    },
    series: [
      {
        name: 'Dòng lead',
        type: 'bar',
        data: top.map((r) => r.count),
        barMaxWidth: 26,
        itemStyle: { color: p.primary },
      },
    ],
  });
  return (
    <section className="ld-panel">
      <div className="ld-panel-head">
        <h2>Phân bố dòng lead</h2>
        {rows.length > 0 && valid && (
          <Button motion="standard" variant="text" onClick={() => setTable((v) => !v)}>
            {table ? 'Biểu đồ' : 'Bảng số liệu'}
          </Button>
        )}
      </div>
      <WorkspaceSelect<Dimension | 'by_question'>
        label="Nhóm theo"
        value={dimension}
        options={[
          ...dimensions.map(([value, label]) => ({ value, label })),
          ...(canViewPii ? [{ value: 'by_question' as const, label: 'Câu hỏi thường gặp' }] : []),
        ]}
        onChange={setDimension}
      />
      {!rows.length ? (
        <p className="ld-note">Không có dữ liệu cho chiều phân tích này.</p>
      ) : table || !valid ? (
        <>
          {!valid && (
            <p role="alert" className="ld-error">
              Số liệu nhóm không hợp lệ.
            </p>
          )}
          <DataTable
            headers={
              faq
                ? ['Câu hỏi', 'Lượt hỏi']
                : ['Nhóm', 'Dòng', 'Tỷ lệ trong nhóm có số liệu', 'Chi tiết']
            }
            rows={rows.map((r) => {
              if (faq) return [groupLabel(r.key), r.count];
              const exact = exactGroupFilter(dimension, r.key, options, filters);
              return [
                groupLabel(r.key),
                r.count,
                percentText(valid && total ? r.count / total : null),
                exact ? (
                  <Button
                    motion="standard"
                    variant="text"
                    onClick={() => onGroup({ [exact.key]: exact.value })}
                  >
                    Xem lead
                  </Button>
                ) : (
                  '—'
                ),
              ];
            })}
          />
        </>
      ) : (
        <ChartView
          key={dimension}
          label="Phân bố số dòng lead"
          makeOption={makeOption}
          height={Math.max(220, top.length * 40 + 48)}
        />
      )}
      <p className="ld-note">
        {numberText(total)} / {numberText(data.kpi.total)} dòng được biểu diễn trong chiều này.
        {rows.length > 10 ? ' Biểu đồ hiển thị 10 nhóm lớn nhất; bảng có toàn bộ nhóm.' : ''}
        {!faq ? ' Mở bảng số liệu để tra cứu nhóm có bộ lọc tương ứng.' : ''}
      </p>
      {faq && (
        <p className="ld-note">
          Nội dung cần đưa vào FAQ / kịch bản tư vấn. Có thể chứa thông tin cá nhân.
        </p>
      )}
      {dimension === 'by_campaign' && <p className="ld-note">Số lead theo chiến dịch quảng cáo.</p>}
      {dimension === 'by_self_declared' && <p className="ld-note">Cần xác minh với Data (CRM).</p>}
    </section>
  );
}
export default function Analytics({
  path,
  resource,
  hasSearch,
  options,
  filters,
  onGroup,
  canViewPii,
}: {
  canViewPii: boolean;
  path: string | null;
  resource: ReturnType<typeof useResource<Summary>>;
  hasSearch: boolean;
  options?: LeadOptions;
  filters: Filters;
  onGroup: (patch: Filters) => void;
}) {
  if (!path)
    return <div className="ld-panel ld-state">Hãy kiểm tra bộ lọc hoặc phạm vi dữ liệu.</div>;
  if (resource.state === 'loading')
    return <LoadingState className="ld-panel" label="Đang tải phân tích…" />;
  if (resource.state === 'error')
    return (
      <div className="ld-panel ld-state">
        <p role="alert">{resource.message}</p>
        <Button motion="standard" variant="tonal" onClick={resource.retry}>
          Thử lại
        </Button>
      </div>
    );
  const data = resource.data,
    k = data.kpi;
  return (
    <div className="ld-analysis">
      {resource.refreshing && (
        <p role="status" className="ld-note">
          Đang làm mới phân tích…
        </p>
      )}
      {resource.refreshError && (
        <p role="alert" className="ld-error">
          {resource.refreshError} · Đang hiển thị dữ liệu lần tải trước.
        </p>
      )}
      {hasSearch && (
        <p className="ld-note">
          Tìm kiếm chỉ áp dụng cho danh sách và CSV, không áp dụng cho phân tích.
        </p>
      )}
      <dl className="ld-metrics">
        <div className="ld-hero">
          <dt>Tổng dòng lead</dt>
          <dd>{numberText(k.total)}</dd>
          <p>Số lượt điền biểu mẫu</p>
        </div>
        <div>
          <dt>Liên hệ có mã duy nhất</dt>
          <dd>{numberText(k.unique_contacts)}</dd>
          <p>Contact ID khác nhau, có giá trị</p>
        </div>
      </dl>
      {(!countsValid(k.total, k.unique_contacts) || k.unique_contacts > k.total) && (
        <p className="ld-error" role="alert">
          Số liệu liên hệ duy nhất không hợp lệ.
        </p>
      )}
      <Reconciliation data={data} options={options} filters={filters} onGroup={onGroup} />
      <Weekly data={data} />
      <Grouping
        canViewPii={canViewPii}
        data={data}
        options={options}
        filters={filters}
        onGroup={onGroup}
      />
      <section className="ld-panel">
        <h2>Nhu cầu và thông tin tự khai</h2>
        <div className="ld-interest">
          <div>
            <span>Muốn nhận lịch Talkshow</span>
            <strong className="ld-big">{numberText(k.wants_talkshow)}</strong>
            <p className="ld-note">Dòng có ghi nhận nhu cầu</p>
          </div>
          <div>
            <span>Tự khai đã đăng ký</span>
            <strong className="ld-big">{numberText(k.self_declared_registered)}</strong>
            <p className="ld-note">Dòng tự khai, chưa xác minh với CRM</p>
          </div>
        </div>
      </section>
    </div>
  );
}
