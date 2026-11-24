import "./communications.css";
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/expressive/button";
import { useWorkspace } from "@/app/workspace";
import { useResource } from "@/services/useResource";
import { BarChart, ChartCard, DataTable, formatMoney, formatNumber, formatPercent, LoadState, Metric, Panel } from "./components";
import { MarketingFilterDialog, marketingPath, type MarketingFilters } from "./MarketingFilters";
import type { MarketingChannel, MarketingSummary } from "./types";

export default function Marketing() {
  const { user, partner, scopeStatus, retryScope } = useWorkspace();
  if (scopeStatus !== "ready") {
    return <LoadState state={scopeStatus === "error" ? "error" : "loading"} message="Không xác nhận được phạm vi dữ liệu." retry={retryScope} label="Đang xác nhận phạm vi dữ liệu…">{null}</LoadState>;
  }
  return <MarketingReport key={JSON.stringify([user.username, user.role, user.partner_code, partner])} partner={user.role === "admin" ? partner : null}/>;
}

function MarketingReport({ partner }: { partner: string | null }) {
  const [filters, setFilters] = useState<MarketingFilters>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const filterCount = Number(Boolean(filters.date_from || filters.date_to))
    + Number(Boolean(filters.board?.length)) + Number(Boolean(filters.region?.length));
  const resource = useResource<MarketingSummary>(marketingPath(partner, filters));
  const data = resource.state === "ready" ? resource.data : null;
  const budgeted = data?.channels.filter((item) => item.budget_visible) ?? [];
  const roi = data?.kpi.roi_program ?? data?.kpi.roi_paid_channels ?? null;
  return <div className="com-page"><p className="com-intro">Hiệu quả các kênh trong phạm vi dữ liệu đang xem. ROI được tính từ doanh thu lệ phí ghi nhận và ngân sách của từng kênh.</p>
    <div className="com-filter-actions">
      <Button variant="outlined" icon={<SlidersHorizontal/>} onClick={() => setFilterOpen(true)}>Bộ lọc{filterCount > 0 && ` · ${filterCount}`}</Button>
      {filterCount > 0 && <Button variant="text" onClick={() => setFilters({})}>Xóa bộ lọc</Button>}
    </div>
    {filterOpen && <MarketingFilterDialog partner={partner} filters={filters} onClose={() => setFilterOpen(false)} onApply={next => {
      setFilters(next);
      setFilterOpen(false);
    }}/>}
    <LoadState state={resource.state} message={resource.state === "error" ? resource.message : undefined} retry={resource.retry}>{data && <>
      {data.filtered && data.kpi.budget !== null && <p className="com-filter-note">Doanh thu và số liên hệ theo bộ lọc. Ngân sách vẫn là ngân sách toàn kênh, nên ROI và CPA chỉ mang tính tham khảo.</p>}
      <div className="com-metrics"><Metric label="Ngân sách truyền thông" value={formatMoney(data.kpi.budget)}/><Metric label="Doanh thu thu về" value={formatMoney(data.kpi.revenue)}/><Metric label={data.kpi.roi_program === null ? "ROI kênh trả phí" : "ROI toàn chương trình"} value={formatPercent(roi, true)}/><Metric label="CPA thanh toán" value={formatMoney(data.kpi.cpa_paid)}/><Metric label="Liên hệ được gán kênh" value={formatNumber(data.kpi.contacts)} detail={`${formatNumber(data.kpi.paid)} đã thanh toán`}/></div>
      <Panel title="Bảng hiệu quả theo kênh" description="ROI = (doanh thu − ngân sách) / ngân sách."><DataTable<MarketingChannel> label="Bảng hiệu quả theo kênh" rows={data.channels} empty="Chưa có kênh truyền thông trong phạm vi này." columns={[
        {key:"channel",label:"Kênh",render:row=><>{row.channel}{row.is_assumed&&<span className="com-badge">Báo cáo ước tính</span>}{row.assumed_contacts > 0 && <span className="com-badge">{formatNumber(row.assumed_contacts)} liên hệ gán theo giả định</span>}</>},{key:"contacts",label:"Liên hệ",numeric:true,render:row=>formatNumber(row.contacts)},{key:"web",label:"Đăng ký web",numeric:true,render:row=>formatNumber(row.web_registered)},{key:"lead",label:"Lead chưa ĐK",numeric:true,render:row=>formatNumber(row.unregistered)},{key:"paid",label:"Thanh toán",numeric:true,render:row=>formatNumber(row.paid)},{key:"conversion",label:"TT / ĐK",numeric:true,render:row=>formatPercent(row.conversion)},{key:"budget",label:"Ngân sách",numeric:true,render:row=>formatMoney(row.budget)},{key:"revenue",label:"Doanh thu",numeric:true,render:row=>formatMoney(row.revenue)},{key:"roi",label:"ROI",numeric:true,render:row=>formatPercent(row.roi,true)},{key:"cpa",label:"CPA thanh toán",numeric:true,render:row=>formatMoney(row.cpa_paid)},{key:"clicks",label:"Click",numeric:true,render:row=>formatNumber(row.clicks)},{key:"ctr",label:"CTR",numeric:true,render:row=>formatPercent(row.ctr)}
      ]}/></Panel>
      <div className="com-chart-grid">
        <ChartCard title="ROI theo kênh" description="Mốc 0% là khi doanh thu lệ phí bằng ngân sách truyền thông."><BarChart label="ROI" rows={budgeted.filter(row => row.roi !== null)} value={row => row.roi} format={value => formatPercent(value, true)}
          tooltipDetails={row => [
            { label: "Doanh thu lệ phí", value: formatMoney(row.revenue) },
            { label: "Ngân sách truyền thông", value: formatMoney(row.budget) },
          ]} negative empty="Không có dữ liệu ngân sách khả dụng."/></ChartCard>
        <ChartCard title="Ngân sách và doanh thu"><BarChart label="Ngân sách" rows={budgeted} value={row=>(row as MarketingChannel).budget} comparison={{label:"Doanh thu",value:row=>(row as MarketingChannel).revenue}} format={formatMoney} empty="Không có ngân sách khả dụng."/></ChartCard>
        <ChartCard title="Chi phí trên mỗi đầu ra (CPA)" description="CPA dự thi là số liệu giả định từ báo cáo."><BarChart label="Chi phí / đăng ký web" rows={budgeted} value={row=>(row as MarketingChannel).cpa_lead} comparison={{label:"CPA thanh toán",value:row=>(row as MarketingChannel).cpa_paid}} third={{label:"CPA dự thi (giả định)",value:row=>(row as MarketingChannel).cpa_active}} format={formatMoney} empty="Không có dữ liệu CPA."/></ChartCard>
        <ChartCard title="Tỉ lệ chuyển đổi thanh toán" description="Đã thanh toán / đăng ký web, theo kênh."><BarChart label="Tỉ lệ chuyển đổi" rows={data.channels.filter(x=>x.web_registered>0)} value={row=>(row as MarketingChannel).conversion} format={formatPercent} empty="Không có đăng ký web để tính tỉ lệ."/></ChartCard>
        <ChartCard title="Liên hệ theo kênh" description="Các trạng thái cộng lại bằng tổng liên hệ của kênh."><BarChart label="Đã thanh toán" rows={[...data.channels].sort((a,b)=>b.contacts-a.contacts)} value={row=>(row as MarketingChannel).paid} comparison={{label:"Đăng ký, chưa thanh toán",value:row=>{const x=row as MarketingChannel; return x.web_registered-x.paid;}}} third={{label:"Lead chưa đăng ký",value:row=>(row as MarketingChannel).unregistered}} stacked format={formatNumber} empty="Chưa có dữ liệu liên hệ."/></ChartCard>
        <ChartCard title="CTR logo / banner" description="Tỉ lệ nhấp vào logo hoặc banner theo báo cáo nguồn."><BarChart label="CTR" rows={budgeted.filter(x=>x.ctr!=null)} value={row=>(row as MarketingChannel).ctr} format={formatPercent} empty="Chưa có dữ liệu CTR."/></ChartCard>
      </div>
    </>}</LoadState></div>;
}
