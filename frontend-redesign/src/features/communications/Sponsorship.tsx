import "./communications.css";
import { useWorkspace } from "@/app/workspace";
import { useResource } from "@/services/useResource";
import { BarChart, ChartCard, Empty, formatNumber, formatPercent, LoadState, Metric, Panel } from "./components";
import type { MediaReach, SponsorBenefit, SponsorshipSummary } from "./types";

const progress = (value: number | null) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1 ? value : null;

export default function Sponsorship() {
  const { partner } = useWorkspace();
  const resource = useResource<SponsorshipSummary>(`/sponsorship/summary${partner ? `?${new URLSearchParams({ partner })}` : ""}`);
  const data = resource.state === "ready" ? resource.data : null;
  const points = data?.benefits.map(x => progress(x.progress)).filter((x): x is number => x !== null) ?? [];
  const average = points.length ? points.reduce((a, b) => a + b, 0) / points.length : null;
  const total = (key: "reach" | "engagement") => {
    const values = data?.reach.map(x => x[key]).filter((x): x is number => typeof x === "number" && Number.isFinite(x)) ?? [];
    return values.length ? values.reduce((a, b) => a + b, 0) : null;
  };
  return <div className="com-page"><p className="com-intro">Theo dõi quyền lợi cam kết với nhà tài trợ và hiệu quả các kênh truyền thông của chương trình.</p>
    <LoadState state={resource.state} message={resource.state === "error" ? resource.message : undefined} retry={resource.retry}>{data && <>
      {resource.refreshError && <div className="com-notice" role="alert">{resource.refreshError}</div>}
      <div className="com-metrics com-metrics--three"><Metric label="Tiến độ quyền lợi" value={formatPercent(average)} detail={`${points.filter(x=>x===1).length}/${data.benefits.length} hạng mục đạt 100%`}/><Metric label="Tổng lượt tiếp cận" value={formatNumber(total("reach"))} detail="Tổng lượt theo kênh, không phải người duy nhất"/><Metric label="Tổng lượt tương tác" value={formatNumber(total("engagement"))}/></div>
      <Panel title="Quyền lợi nhà tài trợ" description="Thanh tiến độ theo tình trạng hoàn thành trong báo cáo.">{data.benefits.length ? <div className="com-benefits">{data.benefits.map((x,i)=><Benefit key={`${x.item}-${i}`} benefit={x}/>)}</div> : <Empty>Chưa có dữ liệu quyền lợi nhà tài trợ.</Empty>}</Panel>
      <div className="com-chart-grid"><ChartCard title="Lượt tiếp cận theo kênh"><BarChart label="Lượt tiếp cận" rows={data.reach} value={x=>(x as MediaReach).reach} format={formatNumber} empty="Chưa có dữ liệu truyền thông."/></ChartCard><ChartCard title="Lượt tương tác theo kênh"><BarChart label="Lượt tương tác" rows={data.reach} value={x=>(x as MediaReach).engagement} format={formatNumber} empty="Chưa có dữ liệu truyền thông."/></ChartCard><ChartCard title="Tỉ lệ tương tác" description="Tương tác / lượt tiếp cận."><BarChart label="Tỉ lệ tương tác" rows={data.reach} value={x=>(x as MediaReach).engagement_rate} format={formatPercent} empty="Chưa có tỉ lệ tương tác."/></ChartCard><ChartCard title="Mức độ quan trọng (khảo sát 1–5)"><BarChart label="Mức độ quan trọng" rows={data.reach} value={x=>(x as MediaReach).importance} format={formatNumber} empty="Chưa có điểm mức độ quan trọng."/></ChartCard></div>
    </>}</LoadState></div>;
}

function Benefit({ benefit }: { benefit: SponsorBenefit }) {
  const value = progress(benefit.progress);
  const status = benefit.status?.trim() || "Chưa có trạng thái";
  const completed = /^hoàn thành(?:\s|$)/iu.test(status);
  const inProgress = /^đang thực hiện(?:\s|$)/iu.test(status);
  const incomplete = /^chưa (?:hoàn thành|thực hiện|bắt đầu)(?:\s|$)/iu.test(status);
  const statusClass = completed ? " com-status--complete" : inProgress ? " com-status--progress" : incomplete ? " com-status--incomplete" : "";
  return <article className="com-benefit"><div className="com-benefit-top"><div><h3>{benefit.item || "Chưa có thông tin"}</h3><p className="com-benefit-detail">{[benefit.placement, benefit.schedule].filter(Boolean).join(" · ") || "Chưa có thông tin"}<br/>{benefit.note}</p></div><div className="com-benefit-status"><span className={`com-status${statusClass}`}>{completed ? "Hoàn thành" : status}</span><strong>{formatPercent(value)}</strong></div></div>{value !== null && <div className="com-progress" role="progressbar" aria-label={`Tiến độ ${benefit.item}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value*100}><span style={{width:`${value*100}%`}}/></div>}</article>;
}
