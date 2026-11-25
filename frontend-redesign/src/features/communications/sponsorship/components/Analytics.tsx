import { Button } from '@/components/expressive/button';
import { LoadingState } from '@/shared/LoadingState';
import { StatusLabel } from '@/shared/StatusLabel';
import { numberText, percentText } from '@/shared/format';
import type { useResource } from '@/services/useResource';
import { ChannelChart } from '../../components/ChannelChart';
import { benefitStatus, metrics, type Benefit, type Summary } from '../model';

function Metrics({ data }: { data: Summary }) {
  const m = metrics(data);
  return (
    <dl className="com-metrics com-metrics--three">
      <div>
        <dt>Tiến độ quyền lợi</dt>
        <dd>{percentText(m.average, 0)}</dd>
        <p>
          {numberText(m.complete)}/{numberText(m.total)} hạng mục hoàn thành
        </p>
      </div>
      <div>
        <dt>Tổng lượt tiếp cận</dt>
        <dd>{numberText(m.reach)}</dd>
        <p>Tổng lượt theo kênh, không phải người duy nhất</p>
      </div>
      <div>
        <dt>Tổng lượt tương tác</dt>
        <dd>{numberText(m.engagement)}</dd>
      </div>
    </dl>
  );
}
function BenefitRow({ row }: { row: Benefit }) {
  const { text, tone, value, duplicatePercent } = benefitStatus(row);
  return (
    <article className="com-benefit">
      <div className="com-benefit-top">
        <div>
          <h3>{row.item || 'Chưa có thông tin'}</h3>
          <p className="com-benefit-detail">
            {[row.placement, row.schedule].filter(Boolean).join(' · ') || '—'}
            {row.note && (
              <>
                <br />
                {row.note}
              </>
            )}
          </p>
        </div>
        <div className="com-benefit-status">
          <StatusLabel tone={tone}>{text}</StatusLabel>
          {!duplicatePercent && <strong>{percentText(value, 1)}</strong>}
        </div>
      </div>
      {value !== null && (
        <div
          className="com-progress"
          role="meter"
          aria-label={`Tiến độ ${row.item}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value * 100}
        >
          <span style={{ width: `${value * 100}%` }} />
        </div>
      )}
    </article>
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
        <p className="dw-note" role="status">
          Đang cập nhật phân tích…
        </p>
      )}
      {resource.refreshError && (
        <p className="dw-error" role="alert">
          {resource.refreshError} · Đang hiển thị dữ liệu lần tải trước.
        </p>
      )}
      <Metrics data={data} />
      <section className="com-panel">
        <div className="com-panel-head">
          <div>
            <h2>Quyền lợi nhà tài trợ</h2>
            <p className="dw-note">Thanh tiến độ theo tình trạng hoàn thành trong báo cáo.</p>
          </div>
        </div>
        {data.benefits.length ? (
          <div className="com-benefits">
            {data.benefits.map((row, i) => (
              <BenefitRow key={`${row.item}-${i}`} row={row} />
            ))}
          </div>
        ) : (
          <p className="dw-note">Chưa có dữ liệu quyền lợi nhà tài trợ.</p>
        )}
      </section>
      <div className="com-chart-grid">
        <ChannelChart
          title="Lượt tiếp cận theo kênh"
          rows={data.reach}
          series={[{ label: 'Lượt tiếp cận', value: (r) => r.reach }]}
        />
        <ChannelChart
          title="Lượt tương tác theo kênh"
          rows={data.reach}
          series={[{ label: 'Lượt tương tác', value: (r) => r.engagement }]}
        />
        <ChannelChart
          title="Tỉ lệ tương tác"
          description="Engagement ÷ Reach"
          rows={data.reach}
          series={[{ label: 'Tỉ lệ tương tác', value: (r) => r.engagement_rate }]}
          format={percentText}
        />
        <ChannelChart
          title="Mức độ quan trọng (khảo sát 1–5)"
          rows={data.reach}
          series={[{ label: 'Điểm', value: (r) => r.importance }]}
          format={(v) => numberText(v, 1)}
        />
      </div>
    </div>
  );
}
