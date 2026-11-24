import "./communications.css";
import { useWorkspace } from "@/app/workspace";
import { useResource } from "@/services/useResource";
import { BarChart, ChartCard, DataTable, formatMoney, formatNumber, formatPercent, LoadState, Metric, Panel } from "./components";
import type { MarketingChannel, MarketingSummary } from "./types";

// CTR is supplied as percentage points by the source field "CTR (%)".
const formatCtr = (value: number | null) => value === null || !Number.isFinite(value) ? "—" : `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value)}%`;

export default function Marketing() {
  const { partner } = useWorkspace();
  const resource = useResource<MarketingSummary>(`/marketing/summary${partner ? `?${new URLSearchParams({ partner })}` : ""}`);
  const data = resource.state === "ready" ? resource.data : null;
  const budgeted = data?.channels.filter((item) => item.budget_visible) ?? [];
  const roi = data?.kpi.roi_program ?? data?.kpi.roi_paid_channels ?? null;
  return <div className="com-page"><p className="com-intro">Hiệu quả các kênh trong phạm vi dữ liệu đang xem. ROI được tính từ doanh thu lệ phí ghi nhận và ngân sách của từng kênh.</p>
    <LoadState state={resource.state} message={resource.state === "error" ? resource.message : undefined} retry={resource.retry}>{data && <>
      <div className="com-metrics"><Metric label="Ngân sách truyền thông" value={formatMoney(data.kpi.budget)}/><Metric label="Doanh thu thu về" value={formatMoney(data.kpi.revenue)}/><Metric label={data.kpi.roi_program === null ? "ROI kênh trả phí" : "ROI toàn chương trình"} value={formatPercent(roi, true)}/><Metric label="CPA thanh toán" value={formatMoney(data.kpi.cpa_paid)}/><Metric label="Liên hệ được gán kênh" value={formatNumber(data.kpi.contacts)} detail={`${formatNumber(data.kpi.paid)} đã thanh toán`}/></div>
      <Panel title="Bảng hiệu quả theo kênh" description="ROI = (doanh thu − ngân sách) / ngân sách."><DataTable<MarketingChannel> label="Bảng hiệu quả theo kênh" rows={data.channels} empty="Chưa có kênh truyền thông trong phạm vi này." columns={[
        {key:"channel",label:"Kênh",render:row=><>{row.channel}{row.is_assumed&&<span className="com-badge">Ước tính</span>}</>},{key:"contacts",label:"Liên hệ",numeric:true,render:row=>formatNumber(row.contacts)},{key:"web",label:"Đăng ký web",numeric:true,render:row=>formatNumber(row.web_registered)},{key:"lead",label:"Lead chưa ĐK",numeric:true,render:row=>formatNumber(row.unregistered)},{key:"paid",label:"Thanh toán",numeric:true,render:row=>formatNumber(row.paid)},{key:"conversion",label:"TT / ĐK",numeric:true,render:row=>formatPercent(row.conversion)},{key:"budget",label:"Ngân sách",numeric:true,render:row=>formatMoney(row.budget)},{key:"revenue",label:"Doanh thu",numeric:true,render:row=>formatMoney(row.revenue)},{key:"roi",label:"ROI",numeric:true,render:row=>formatPercent(row.roi,true)},{key:"cpa",label:"CPA thanh toán",numeric:true,render:row=>formatMoney(row.cpa_paid)},{key:"clicks",label:"Click",numeric:true,render:row=>formatNumber(row.clicks)},{key:"ctr",label:"CTR",numeric:true,render:row=>formatCtr(row.ctr)}
      ]}/></Panel>
      <div className="com-chart-grid">
        <ChartCard title="ROI theo kênh" description="Màu nhấn: có lãi · Màu lỗi: lỗ so với ngân sách."><BarChart label="ROI theo kênh" rows={budgeted} value={row=>(row as MarketingChannel).roi} format={value=>formatPercent(value,true)} negative empty="Không có dữ liệu ngân sách khả dụng."/></ChartCard>
        <ChartCard title="Ngân sách và doanh thu"><BarChart label="Ngân sách" rows={budgeted} value={row=>(row as MarketingChannel).budget} comparison={{label:"Doanh thu",value:row=>(row as MarketingChannel).revenue}} format={formatMoney} empty="Không có ngân sách khả dụng."/></ChartCard>
        <ChartCard title="Chi phí trên mỗi đầu ra (CPA)" description="CPA dự thi là số liệu giả định từ báo cáo."><BarChart label="CPA lead" rows={budgeted} value={row=>(row as MarketingChannel).cpa_lead} comparison={{label:"CPA thanh toán",value:row=>(row as MarketingChannel).cpa_paid}} third={{label:"CPA dự thi (giả định)",value:row=>(row as MarketingChannel).cpa_active}} format={formatMoney} empty="Không có dữ liệu CPA."/></ChartCard>
        <ChartCard title="Tỉ lệ chuyển đổi thanh toán" description="Đã thanh toán / đăng ký web, theo kênh."><BarChart label="Tỉ lệ chuyển đổi" rows={data.channels.filter(x=>x.web_registered>0)} value={row=>(row as MarketingChannel).conversion} format={formatPercent} empty="Không có đăng ký web để tính tỉ lệ."/></ChartCard>
        <ChartCard title="Liên hệ theo kênh" description="Các trạng thái cộng lại bằng tổng liên hệ của kênh."><BarChart label="Đã thanh toán" rows={[...data.channels].sort((a,b)=>b.contacts-a.contacts)} value={row=>(row as MarketingChannel).paid} comparison={{label:"Đăng ký, chưa thanh toán",value:row=>{const x=row as MarketingChannel; return x.web_registered-x.paid;}}} third={{label:"Lead chưa đăng ký",value:row=>(row as MarketingChannel).unregistered}} stacked format={formatNumber} empty="Chưa có dữ liệu liên hệ."/></ChartCard>
        <ChartCard title="CTR logo / banner" description="CTR theo đơn vị phần trăm của dữ liệu nguồn."><BarChart label="CTR" rows={budgeted.filter(x=>x.ctr!=null)} value={row=>(row as MarketingChannel).ctr} format={formatCtr} empty="Chưa có dữ liệu CTR."/></ChartCard>
      </div>
    </>}</LoadState></div>;
}
