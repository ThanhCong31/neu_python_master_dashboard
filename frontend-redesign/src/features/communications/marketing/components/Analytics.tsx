import { Button } from '@/components/expressive/button';
import { Tooltip } from '@/components/expressive/tooltip';
import type { ReactNode } from 'react';
import { LoadingState } from '@/shared/LoadingState';
import { AnalysisTable, type AnalysisColumn } from '@/shared/AnalysisTable';
import { StatusLabel } from '@/shared/StatusLabel';
import {
  compactMoney,
  moneyText,
  numberText,
  percentText,
  percentagePointsText,
} from '@/shared/format';
import type { useResource } from '@/services/useResource';
import { ChannelChart } from '../../components/ChannelChart';
import {
  budgeted,
  conversionValid,
  labelFor,
  reconciliationRows,
  type Channel,
  type Summary,
} from '../model';

const signedPercent = (value: number | null | undefined) =>
  value != null && Number.isFinite(value) && value > 0
    ? `+${percentText(value)}`
    : percentText(value);
const numeric = (
  key: string,
  label: string,
  render: (r: Channel) => ReactNode,
  definition?: string,
): AnalysisColumn<Channel> => ({
  key,
  label,
  render,
  numeric: true,
  heading: definition ? (
    <Tooltip content={definition}>
      <span tabIndex={0} className="com-column-label focus-ring">
        {label}
      </span>
    </Tooltip>
  ) : undefined,
});
const channelColumns: AnalysisColumn<Channel>[] = [
  {
    key: 'channel',
    label: 'Kênh',
    render: (r) => (
      <div className="com-channel-name">
        <span>{labelFor(r)}</span>
        {r.budget_visible && r.is_assumed && <StatusLabel tone="tertiary">GĐ</StatusLabel>}
        {r.assumed_contacts > 0 && (
          <small className="dw-note">
            {numberText(r.assumed_contacts)} liên hệ gán theo giả định
          </small>
        )}
      </div>
    ),
  },
  numeric('contacts', 'Liên hệ', (r) => numberText(r.contacts)),
  numeric('web_registered', 'Đăng ký web', (r) => numberText(r.web_registered)),
  numeric('unregistered', 'Lead chưa ĐK', (r) => numberText(r.unregistered)),
  numeric('paid', 'Thanh toán', (r) => numberText(r.paid)),
  numeric(
    'conversion',
    'TT / ĐK',
    (r) => percentText(r.conversion),
    'Số đã thanh toán / số đăng ký web',
  ),
  numeric('budget', 'Ngân sách', (r) => moneyText(r.budget_visible ? r.budget : null)),
  numeric('revenue', 'Doanh thu', (r) => moneyText(r.revenue)),
  numeric(
    'roi',
    'ROI',
    (r) => {
      const value = r.budget_visible ? r.roi : null;
      return (
        <span
          data-roi={
            value != null && Number.isFinite(value)
              ? value > 0
                ? 'positive'
                : value < 0
                  ? 'negative'
                  : undefined
              : undefined
          }
        >
          {signedPercent(value)}
        </span>
      );
    },
    'Lợi tức: (doanh thu − ngân sách) / ngân sách',
  ),
  numeric(
    'cpa_paid',
    'CPA thanh toán',
    (r) => moneyText(r.budget_visible ? r.cpa_paid : null),
    'Chi phí trên mỗi hồ sơ đã thanh toán',
  ),
  numeric('clicks', 'Click', (r) => numberText(r.budget_visible ? r.clicks : null)),
  numeric(
    'ctr',
    'CTR',
    (r) => percentagePointsText(r.budget_visible ? r.ctr : null),
    'Tỉ lệ click; lấy trực tiếp từ báo cáo nguồn',
  ),
];
function Metrics({ data }: { data: Summary }) {
  const k = data.kpi;
  const roi = k.roi_program ?? k.roi_paid_channels;
  return (
    <dl className="com-metrics">
      <div>
        <dt>Ngân sách truyền thông</dt>
        <dd title={moneyText(k.budget)}>{compactMoney(k.budget)}</dd>
      </div>
      <div>
        <dt>Doanh thu thu về</dt>
        <dd title={moneyText(k.revenue)}>{compactMoney(k.revenue)}</dd>
      </div>
      <div>
        <dt>{k.roi_program === null ? 'ROI kênh trả phí' : 'ROI toàn chương trình'}</dt>
        <dd>{signedPercent(roi)}</dd>
        {k.roi_program !== null && <p>Kênh trả phí: {signedPercent(k.roi_paid_channels)}</p>}
      </div>
      <div>
        <dt>CPA / thí sinh thanh toán</dt>
        <dd title={moneyText(k.cpa_paid)}>{compactMoney(k.cpa_paid)}</dd>
        <p>Trên các kênh có ngân sách</p>
      </div>
      <div>
        <dt>Liên hệ được gán kênh</dt>
        <dd>{numberText(k.contacts)}</dd>
        <p>{numberText(k.paid)} đã thanh toán</p>
      </div>
    </dl>
  );
}
function Charts({ data }: { data: Summary }) {
  const visible = budgeted(data.channels);
  const registrations = data.channels.filter((r) => r.web_registered > 0);
  const ordered = [...data.channels].sort((a, b) => b.contacts - a.contacts);
  const recon = reconciliationRows(data.channels);
  return (
    <div className="com-chart-grid">
      <ChannelChart
        title="ROI theo kênh"
        description="Màu chủ đạo: có lãi; màu lỗi: lỗ so với ngân sách. Mốc 0% là hòa vốn."
        rows={visible}
        series={[{ label: 'ROI', value: (r) => r.roi }]}
        signed
        format={signedPercent}
        axisFormat={percentText}
        empty="Không có dữ liệu ngân sách khả dụng."
        extraColumns={[
          numeric('revenue', 'Doanh thu', (r) => moneyText(r.revenue)),
          numeric('budget', 'Ngân sách', (r) => moneyText(r.budget)),
        ]}
        tooltipDetails={(r) => [
          { label: 'Doanh thu lệ phí', value: moneyText(r.revenue) },
          { label: 'Ngân sách', value: moneyText(r.budget) },
        ]}
      />
      <ChannelChart
        title="Ngân sách và doanh thu"
        rows={visible}
        series={[
          { label: 'Ngân sách', value: (r) => r.budget },
          { label: 'Doanh thu', value: (r) => r.revenue },
        ]}
        format={moneyText}
        axisFormat={compactMoney}
        empty="Không có ngân sách khả dụng."
      />
      <ChannelChart
        title="Chi phí trên mỗi đầu ra (CPA)"
        description="Lead cơ bản → thanh toán → dự thi thực tế (giả định). CPA thanh toán của kênh không có thanh toán sẽ trống."
        rows={visible}
        series={[
          { label: 'CPA lead', value: (r) => r.cpa_lead },
          { label: 'CPA thanh toán', value: (r) => r.cpa_paid },
          { label: 'CPA dự thi (GĐ)', value: (r) => r.cpa_active },
        ]}
        format={moneyText}
        axisFormat={compactMoney}
        extraColumns={[
          numeric('active', 'Dự thi (giả định)', (r) => numberText(r.active_candidates_assumed)),
        ]}
      />
      <ChannelChart
        title="Tỉ lệ chuyển đổi thanh toán"
        description="Đã thanh toán / đăng ký web, theo kênh."
        rows={registrations}
        series={[{ label: 'Tỉ lệ', value: (r) => r.conversion }]}
        format={percentText}
        extraColumns={[
          numeric('paid', 'Đã thanh toán', (r) => numberText(r.paid)),
          numeric('web', 'Đăng ký web', (r) => numberText(r.web_registered)),
        ]}
        empty="Không có đăng ký web để tính tỉ lệ."
      />
      <ChannelChart
        title="Liên hệ theo kênh"
        description="Các trạng thái cộng lại bằng tổng liên hệ của kênh."
        rows={ordered}
        valid={ordered.every(conversionValid)}
        series={[
          { label: 'Đã thanh toán', value: (r) => r.paid },
          { label: 'Đăng ký, chưa ghi nhận phí', value: (r) => r.web_registered - r.paid },
          { label: 'Lead chưa đăng ký', value: (r) => r.unregistered },
        ]}
        stacked
        extraColumns={[
          numeric('total', 'Liên hệ', (r) => numberText(r.contacts)),
          numeric('web', 'Đăng ký web', (r) => numberText(r.web_registered)),
          numeric('rate', 'TT / ĐK', (r) => percentText(r.conversion)),
          numeric('revenue', 'Doanh thu', (r) => moneyText(r.revenue)),
        ]}
      />
      <ChannelChart
        title="CTR logo / banner"
        description="Số click và CTR nhập tay từ báo cáo gốc"
        rows={visible.filter((r) => r.ctr != null || r.clicks != null)}
        series={[{ label: 'CTR', value: (r) => r.ctr }]}
        format={percentagePointsText}
        extraColumns={[numeric('clicks', 'Click', (r) => numberText(r.clicks))]}
      />
      {recon.length > 0 && (
        <>
          <ChannelChart
            title="Đối soát: đăng ký theo kênh"
            description="Báo cáo gốc đếm dòng thô; sau đối soát là người duy nhất đã đăng ký web."
            rows={recon}
            series={[
              { label: 'Báo cáo gốc', value: (r) => r.original_report?.registrations },
              { label: 'Sau đối soát', value: (r) => r.web_registered },
            ]}
            extraColumns={[
              {
                key: 'comment',
                label: 'Nhận xét',
                render: (r) => r.original_report?.comment ?? '—',
              },
            ]}
          />
          <ChannelChart
            title="Đối soát: doanh thu theo kênh"
            description="So sánh doanh thu trong báo cáo gốc với số liệu ghi nhận."
            rows={recon}
            series={[
              { label: 'Báo cáo gốc', value: (r) => r.original_report?.revenue },
              { label: 'Sau đối soát', value: (r) => r.revenue },
            ]}
            format={moneyText}
            axisFormat={compactMoney}
            extraColumns={[
              numeric('roiOriginal', 'ROI gốc', (r) => signedPercent(r.original_report?.roi)),
              numeric('roiCurrent', 'ROI sau đối soát', (r) => signedPercent(r.roi)),
            ]}
          />
        </>
      )}
    </div>
  );
}
export default function Analytics({
  resource,
}: {
  resource: ReturnType<typeof useResource<Summary>>;
}) {
  if (resource.state === 'loading')
    return <LoadingState className="com-panel" label="Đang tải phân tích…" />;
  if (resource.state === 'error')
    return (
      <div className="com-panel com-state">
        <p role="alert">{resource.message}</p>
        <Button motion="standard" variant="tonal" onClick={resource.retry}>
          Thử lại
        </Button>
      </div>
    );
  const data = resource.data;
  return (
    <div className="com-analysis">
      {resource.refreshing && (
        <p role="status" className="dw-note">
          Đang cập nhật phân tích…
        </p>
      )}
      {resource.refreshError && (
        <p className="dw-error" role="alert">
          {resource.refreshError} · Đang hiển thị dữ liệu lần tải trước.
        </p>
      )}
      {data.filtered && data.kpi.budget !== null && (
        <p className="com-filter-note">
          Doanh thu và số liên hệ theo bộ lọc; ngân sách và báo cáo gốc là số liệu toàn kênh. ROI,
          CPA và đối soát chỉ mang tính tham khảo.
        </p>
      )}
      {data.channels.some((r) => (r.budget_visible && r.is_assumed) || r.assumed_contacts > 0) && (
        <p className="com-filter-note">
          Số liệu gán kênh giả định được phân bổ từ các liên hệ web chưa gắn UTM, không phải lượt
          thu hút đo trực tiếp. Kênh đánh dấu GĐ sử dụng số liệu giả định.
        </p>
      )}
      <Metrics data={data} />
      <section className="com-panel com-channel-performance">
        <div className="com-panel-head">
          <div>
            <h2>Bảng hiệu quả theo kênh</h2>
            <p className="dw-note">
              GĐ = số liệu giả định. ROI = (doanh thu − ngân sách) / ngân sách.
            </p>
          </div>
        </div>
        <AnalysisTable
          label="Bảng hiệu quả theo kênh"
          rows={data.channels}
          columns={channelColumns}
          rowKey={(r, i) => `${r.channel}-${i}`}
          empty="Chưa có kênh truyền thông trong phạm vi này."
        />
      </section>
      <Charts data={data} />
    </div>
  );
}
