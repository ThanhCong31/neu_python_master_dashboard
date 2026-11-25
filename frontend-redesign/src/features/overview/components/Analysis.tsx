import { MatrixAnalysisTable, type MatrixTableProps } from '@/shared/AnalysisTable';
import { ChartBoundary } from '@/shared/charts/ChartBoundary';
import { LoadingState } from '@/shared/LoadingState';
import { lazy, Suspense, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Table2, ChartNoAxesCombined } from 'lucide-react';
import { Button } from '@/components/expressive/button';
import { GradeDistribution } from '@/shared/charts/GradeDistribution';
import { ViewSwitch } from '@/components/expressive/view-switch';
import { numberText, moneyText, percentText, dateText } from '@/shared/format';
import {
  ratio,
  validFunnel,
  gradeOrder,
  gradeRows,
  type CrmKpi,
  type OverviewData,
  type TimelinePoint,
} from '../model';
import { type ChartPalette } from '@/shared/charts/theme';
import { categoryTickIndices, shortChartDate, type ChartLayout } from '@/shared/charts/responsive';
const Chart = lazy(() => import('@/shared/charts/Chart'));

export function DetailLink({ to, children }: { to?: string; children: string }) {
  return to ? (
    <Link className="ov-link focus-ring" to={to}>
      {children}
      <ArrowUpRight size={17} aria-hidden="true" />
    </Link>
  ) : null;
}
export function Funnel({ k }: { k: CrmKpi }) {
  const steps = [
    { name: 'Liên hệ duy nhất', value: k.total, previous: null },
    { name: 'Đăng ký website', value: k.web_registered, previous: k.total },
    { name: 'Đã đóng phí', value: k.paid, previous: k.web_registered },
  ];
  const valid = validFunnel(k);
  return (
    <section className="ov-panel">
      <div>
        <h2>Tiến trình tuyển sinh</h2>
        <p className="ov-note">Chuyển đổi trên cùng tập liên hệ.</p>
      </div>
      {!valid && (
        <p className="ov-error" role="alert">
          Số lượng giữa các bước chưa nhất quán; không vẽ tỷ lệ cho tới khi đối soát.
        </p>
      )}
      <ol className="ov-funnel">
        {steps.map((s, i) => (
          <li key={s.name}>
            <div className="ov-funnel-label">
              <span>{s.name}</span>
              <strong>{numberText(s.value)}</strong>
            </div>
            {valid && (
              <div className="ov-track" aria-hidden="true">
                <div
                  className={`ov-fill ov-step-${i}`}
                  style={{ width: `${(ratio(s.value, k.total) ?? 0) * 100}%` }}
                />
              </div>
            )}
            {s.previous !== null && valid && (
              <p className="ov-note">{percentText(ratio(s.value, s.previous))} so với bước trước</p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
export function FollowUp({ k, to }: { k: CrmKpi; to?: string }) {
  return (
    <section className="ov-panel ov-follow">
      <div>
        <h2>Hồ sơ chưa ghi nhận đóng phí</h2>
        <p className="ov-note">Đã đăng ký trên website</p>
      </div>
      <div className="ov-follow-value">{numberText(k.unpaid_registered)}</div>
      <div>
        <p className="ov-note">Tổng lệ phí của nhóm này</p>
        <strong className="ov-follow-money">{moneyText(k.potential_revenue)}</strong>
      </div>
      <p className="ov-note">
        Không phải doanh thu dự báo. Có thể bao gồm hồ sơ miễn phí; cần đối soát trước khi liên hệ.
      </p>
      <DetailLink to={to}>Xem liên hệ & chuyển đổi</DetailLink>
    </section>
  );
}
function Table(props: MatrixTableProps) {
  return (
    <MatrixAnalysisTable
      {...props}
      containerClassName="ov-table-scroll focus-ring"
      tableClassName="ov-table"
      formatBody={(value) => (typeof value === 'number' ? numberText(value, 2) : value)}
    />
  );
}
// One definition for plot, legend and table: Material roles with solid lines.
const timelineSeries = [
  {
    key: 'contacts',
    name: 'Liên hệ',
    color: 'onSecondaryContainer',
    daily: 'new_contacts',
    cumulative: 'cum_contacts',
  },
  {
    key: 'registrations',
    name: 'Đăng ký web',
    color: 'primary',
    daily: 'registrations',
    cumulative: 'cum_registrations',
  },
  { key: 'paid', name: 'Đã đóng phí', color: 'tertiary', daily: 'paid', cumulative: 'cum_paid' },
] as const;

export function Timeline({ timeline, k }: { timeline: TimelinePoint[]; k: CrmKpi }) {
  const [cumulative, setCumulative] = useState(true);
  const [table, setTable] = useState(false);
  const makeOption = useCallback(
    (p: ChartPalette, layout: ChartLayout) => {
      const dates = timeline.map((t) => dateText(t.date));
      const multipleYears = new Set(timeline.map((t) => t.date.slice(0, 4))).size > 1;
      const ticks = categoryTickIndices(
        dates.length,
        Math.max(2, layout.tickBudget - (multipleYears ? 1 : 0)),
      );
      return {
        legend: {},
        grid: {
          left: layout.compact ? 2 : 12,
          right: multipleYears ? 28 : 22,
          top: 12,
          bottom: layout.compact ? 12 : 24,
          containLabel: true,
        },
        // Keep complete dates for axis-triggered tooltips; only axis captions are abbreviated.
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: dates,
          axisLabel: {
            color: p.muted,
            fontSize: layout.compact ? 11 : 12,
            margin: 8,
            interval: (index: number) => ticks.has(index),
            formatter: (value: string) => shortChartDate(value, multipleYears),
            hideOverlap: true,
            showMinLabel: true,
            showMaxLabel: true,
          },
          axisLine: { lineStyle: { color: p.grid } },
          axisTick: { show: false },
        },
        yAxis: {
          type: 'value',
          min: 0,
          minInterval: 1,
          splitNumber: layout.compact ? 4 : 5,
          axisLabel: {
            color: p.muted,
            fontSize: layout.compact ? 11 : 12,
            margin: 6,
            formatter: (value: number) => numberText(value),
          },
          splitLine: { lineStyle: { color: p.grid, opacity: 0.55 } },
          axisLine: { show: false },
        },
        series: timelineSeries.map((s) => ({
          name: s.name,
          type: 'line',
          data: timeline.map((t) => t[cumulative ? s.cumulative : s.daily]),
          showSymbol: timeline.length === 1,
          symbolSize: 8,
          smooth: false,
          itemStyle: { color: p[s.color] },
          lineStyle: { color: p[s.color], width: 3, type: 'solid' },
          emphasis: { focus: 'series' },
        })),
      };
    },
    [timeline, cumulative],
  );
  return (
    <section className="ov-panel ov-chart-panel ov-timeline">
      <div className="ov-chart-heading">
        <div>
          <h2>Hoạt động tuyển sinh</h2>
          <p className="ov-note">
            {cumulative
              ? 'Cộng dồn từ ngày đầu có dữ liệu đến ngày đang xem.'
              : 'Số hồ sơ theo từng ngày tiếp xúc đầu tiên / đăng ký web.'}
          </p>
        </div>
      </div>
      {!timeline.length ? (
        <p className="ov-note">Không có mốc thời gian trong phạm vi này.</p>
      ) : (
        <>
          <div className="ov-chart-toolbar">
            <ViewSwitch
              compact
              label="Chế độ thời gian"
              value={cumulative ? 'cumulative' : 'daily'}
              options={[
                { value: 'daily', label: 'Theo ngày' },
                { value: 'cumulative', label: 'Lũy kế' },
              ]}
              onChange={(value) => setCumulative(value === 'cumulative')}
            />
            <Button
              className="ov-chart-view"
              variant="text"
              size="sm"
              icon={table ? <ChartNoAxesCombined /> : <Table2 />}
              onClick={() => setTable((v) => !v)}
            >
              {table ? 'Biểu đồ' : 'Bảng số liệu'}
            </Button>
          </div>
          {table ? (
            <Table
              headers={['Ngày', ...timelineSeries.map((s) => s.name)]}
              rows={timeline.map((t) => [
                dateText(t.date),
                ...timelineSeries.map((s) => t[cumulative ? s.cumulative : s.daily]),
              ])}
            />
          ) : (
            <>
              <ChartBoundary
                className="ov-note"
                message="Không tải được biểu đồ. Chọn “Bảng số liệu” để tiếp tục."
              >
                <Suspense
                  fallback={
                    <LoadingState
                      label="Đang tải biểu đồ…"
                      chartHeight={300}
                      compactChartHeight={240}
                    />
                  }
                >
                  <Chart
                    label={
                      cumulative
                        ? 'Biểu đồ hoạt động tuyển sinh lũy kế'
                        : 'Biểu đồ hoạt động tuyển sinh theo ngày'
                    }
                    makeOption={makeOption}
                    height={300}
                    compactHeight={240}
                  />
                </Suspense>
              </ChartBoundary>
            </>
          )}
        </>
      )}
      <p className="ov-note">
        Hồ sơ đã đóng phí được nhóm theo ngày đăng ký web, không phải ngày phát sinh giao dịch.
      </p>
      {(k.undated_contacts > 0 || k.undated_registrations > 0 || k.undated_paid > 0) && (
        <p className="ov-note">
          Không có ngày: {numberText(k.undated_contacts)} liên hệ,{' '}
          {numberText(k.undated_registrations)} đăng ký, {numberText(k.undated_paid)} đăng ký đã
          đóng phí. Các chỉ số tổng vẫn bao gồm chúng.
        </p>
      )}
    </section>
  );
}
export function Grades({
  grades,
  to,
}: {
  grades: NonNullable<OverviewData['exams']>['grades'];
  to?: string;
}) {
  const rows = gradeRows(grades);
  // Do not reserve an empty fifth category when all records have known grades.
  const indices = gradeOrder
    .map((_, i) => i)
    .filter((i) => i !== gradeOrder.length - 1 || rows.some((r) => r.counts[i] !== 0));
  return (
    <section className="ov-panel ov-chart-panel">
      <div className="ov-panel-head">
        <div>
          <h2>Xếp loại vòng loại</h2>
          <p className="ov-note">Bộ dữ liệu giả lập PM119 · phân theo bảng thi</p>
        </div>
        <DetailLink to={to}>Xem phân tích kết quả thi</DetailLink>
      </div>
      <GradeDistribution
        label="Phân bố xếp loại vòng loại theo bảng"
        categories={indices.map((i) => gradeOrder[i])}
        rows={rows.map((r) => ({ board: r.board, counts: indices.map((i) => r.counts[i]) }))}
      />
      <p className="ov-note">Xếp loại theo kết quả đã ghi nhận. Điểm thi là dữ liệu giả lập.</p>
    </section>
  );
}
