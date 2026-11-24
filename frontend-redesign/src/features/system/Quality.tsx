import "./system.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageRefresh } from "@/shared/PageActions";
import { useWorkspace } from "@/app/workspace";
import { SystemSelect } from "./components/SystemSelect";
import { useResource } from "@/services/useResource";
import type { QualityList, QualityRow, QualitySummary } from "./types";
import { Chip, DataTable, formatDate, formatNumber, Metric, Notice, Pager, Section, State, Tabs, textValue } from "./components/Elements";

type Tab = "issues" | "duplicates" | "import";
const PAGE_SIZE = 15;
function query(path: string, params: Record<string, string | number | null>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== null && value !== "") search.set(key, String(value));
  return `${path}?${search.toString()}`;
}
function Distribution({ data }: { data: Array<{label:string; count:number}> }) {
  const valid = data.every(x=>Number.isSafeInteger(x.count)&&x.count>=0);
  const max = Math.max(1, ...data.map(x=>x.count));
  return <div className="sys-bars">{!valid&&<p role="alert" className="sys-muted">Số đếm không hợp lệ; chỉ hiển thị số liệu nguồn.</p>}{data.length ? data.map(({label,count}) => <div className="sys-bar" key={label}>
    <div className="sys-bar-head"><span title={label}>{label}</span><strong>{formatNumber(count)}</strong></div>
    {valid&&<div className="sys-bar-track" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={count}>
      <div className="sys-bar-fill" style={{width:`${count/max*100}%`}} />
    </div>}
  </div>) : <p className="sys-muted">Không có dữ liệu trong phạm vi này.</p>}</div>;
}
function totals<T extends {count:number}>(rows: T[], name: (r:T)=>string) {
  const entries = new Map<string,number>();
  for (const row of rows) entries.set(name(row), (entries.get(name(row)) ?? 0) + row.count);
  return [...entries].map(([label,count])=>({label,count})).sort((a,b)=>b.count-a.count);
}
function Logs({ kind, partner, summary, refreshSignal, onBusy }: {kind:"issues"|"duplicates";partner:string|null;summary:QualitySummary;refreshSignal:number;onBusy:(busy:boolean)=>void}) {
  const [page,setPage]=useState(1);
  const [source,setSource]=useState("");
  const [issue,setIssue]=useState("");
  useEffect(()=>{ setPage(1);setSource("");setIssue(""); },[partner,kind]);
  const dimensions = kind==="issues" ? summary.by_issue : summary.by_reason;
  const sources = [...new Set(dimensions.map(x=>x.source).filter(Boolean))].sort();
  const issueLabels = [...new Set(dimensions.map(x=>"issue" in x ? x.issue : x.reason).filter(Boolean))].sort();
  const resource = useResource<QualityList>(query("/quality/list", {kind,partner,page,page_size:PAGE_SIZE,source,issue}));
  useEffect(()=>{onBusy(resource.state==="loading"||resource.refreshing);return()=>onBusy(false);},[resource.state,resource.refreshing,onBusy]);
  const lastRefresh = useRef(refreshSignal);
  useEffect(() => {
    if (refreshSignal === lastRefresh.current) return;
    lastRefresh.current = refreshSignal;
    resource.retry();
  }, [refreshSignal]);
  useEffect(() => {
    if (resource.state !== "ready") return;
    const pages = Math.max(1, Math.ceil(resource.data.total / PAGE_SIZE));
    if (page > pages) setPage(pages);
  }, [resource.state, resource.state === "ready" ? resource.data.total : 0, page]);
  const rows = resource.state==="ready" ? resource.data.rows : [];
  const total = resource.state==="ready" ? resource.data.total : 0;
  return <div className="sys-stack">
    <div className="sys-filters">
      <SystemSelect labelPlacement="above" label="Nguồn dữ liệu" value={source} allLabel="Tất cả nguồn" options={sources.map(s=>({value:s,label:s}))} onChange={value=>{setSource(value);setPage(1);}} />
      <SystemSelect labelPlacement="above" label={kind==="issues"?"Loại vấn đề":"Lý do gộp trùng"} value={issue} allLabel="Tất cả loại" options={issueLabels.map(s=>({value:s,label:s}))} onChange={value=>{setIssue(value);setPage(1);}} />
    </div>
    <State status={resource.state} refreshError={resource.refreshError} error={resource.state==="error"?resource.message:undefined} retry={resource.retry}>
      <DataTable<QualityRow> rows={rows} rowKey={(r,i)=>`${textValue(r.source)}-${textValue(r.row_no)}-${i}`} columns={kind==="issues" ? [
        {key:"issue",heading:"Loại vấn đề",get:r=><strong>{textValue(r.issue_type)}</strong>},
        {key:"source",heading:"Nguồn",get:r=>textValue(r.source)},
        {key:"row",align:"center",heading:"Dòng",get:r=>textValue(r.row_no)},
        {key:"contact",heading:"Hồ sơ",get:r=>textValue(r.contact_id)},
        {key:"before",heading:"Trước chuẩn hóa",get:r=>textValue(r.value_before)},
        {key:"after",heading:"Sau chuẩn hóa",get:r=>textValue(r.value_after)},
      ] : [
        {key:"source",heading:"Nguồn",get:r=>textValue(r.source)},
        {key:"row",align:"center",heading:"Dòng",get:r=>textValue(r.row_no)},
        {key:"contact",heading:"Gộp vào",get:r=>textValue(r.contact_id)},
        {key:"name",heading:"Tên gốc",get:r=>textValue(r.full_name_raw)},
        {key:"email",heading:"Email gốc",get:r=>textValue(r.email_raw)},
        {key:"reason",heading:"Lý do",get:r=>textValue(r.reason)},
      ]} />
      <Pager page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
    </State>
  </div>;
}
function Imports({summary}:{summary:QualitySummary}) {
  const entry=summary.last_import;
  if (!entry) return <div className="sys-state">Chưa có lịch sử nhập dữ liệu.</div>;
  const checks = Array.isArray(entry.checks) ? entry.checks : [];
  const files = Array.isArray(entry.files) ? entry.files : [];
  return <div className="sys-stack">
    <div className="sys-actions sys-actions--wrap"><Chip kind={entry.ok?"good":"bad"}>{entry.ok?"Đối soát thành công":"Có kiểm tra chưa đạt"}</Chip><span className="sys-muted">Hoàn tất: {formatDate(entry.finished_at)}</span></div>
    <h3 className="sys-subheading">Đối soát dữ liệu</h3>
    <DataTable rows={checks} rowKey={(r,i)=>`${r.check}-${i}`} columns={[
      {key:"check",heading:"Kiểm tra",get:r=>r.check},
      {key:"actual",heading:"Thực tế",get:r=>textValue(r.actual)},
      {key:"expected",heading:"Dự kiến",get:r=>textValue(r.expected)},
      {key:"ok",align:"center",heading:"Kết quả",get:r=><Chip kind={r.ok?"good":"bad"}>{r.ok?"Khớp":"Lệch"}</Chip>}
    ]}/>
    <h3 className="sys-subheading">File đầu vào</h3>
    <DataTable rows={files} rowKey={(r,i)=>`${r.name}-${i}`} columns={[
      {key:"name",heading:"Tên file",get:r=>r.name},
      {key:"size",align:"end",heading:"Kích thước",get:r=>`${formatNumber(Math.round(r.size/1024))} KB`},
      {key:"sha",heading:"SHA-256 (rút gọn)",get:r=><code>{r.sha256?.slice(0,20) ?? "—"}</code>},
    ]}/>
  </div>;
}
function ScopedQuality() {
  const {partner,user}=useWorkspace();
  const [tab,setTab]=useState<Tab>("issues");
  const [refreshSignal,setRefreshSignal]=useState(0);
  const [logsBusy,setLogsBusy]=useState(false);
  const url=query("/quality/summary",{partner});
  const resource=useResource<QualitySummary>(url);
  const data=resource.state==="ready"?resource.data:null;
  const isAdmin=user.role==="admin";
  useEffect(()=>{ if ((!isAdmin || partner !== null) && tab==="import") setTab("issues"); },[isAdmin,partner,tab]);
  const issueTotal=data?.by_issue.reduce((n,x)=>n+x.count,0) ?? 0;
  const duplicateTotal=data?.by_reason.reduce((n,x)=>n+x.count,0) ?? 0;
  const issues=useMemo(()=>totals(data?.by_issue ?? [],r=>r.issue),[data]);
  const reasons=useMemo(()=>totals(data?.by_reason ?? [],r=>r.reason),[data]);
  return <div className="sys-page">
    <PageRefresh busy={resource.state==="loading"||resource.refreshing||logsBusy} onRefresh={()=>{resource.retry();setRefreshSignal(n=>n+1);}}/>
    <p className="sys-muted">Theo dõi chuẩn hóa, gộp trùng và truy vết dữ liệu nguồn.</p>
    <State status={resource.state} refreshError={resource.refreshError} error={resource.state==="error"?resource.message:undefined} retry={resource.retry}>
      {data && <>
        <Notice>{isAdmin && partner===null ? "Các thống kê nhật ký đang ở phạm vi toàn hệ thống." : "Đang xem phạm vi đối tác. Thống kê pipeline và lịch sử nhập toàn hệ thống được ẩn để tránh so sánh sai phạm vi."} Dữ liệu cá nhân được API che theo quyền tài khoản.</Notice>
        <div className="sys-metrics sys-metrics--quality">
          <Metric label="Sự kiện chuẩn hóa" value={formatNumber(issueTotal)} detail="Số sự kiện, không phải số người" />
          <Metric label="Bản ghi gộp trùng" value={formatNumber(duplicateTotal)} detail="Sự kiện trong nhật ký trùng" />
          <Metric label="Loại lỗi" value={formatNumber(issues.length)} />
          <Metric label="Nguồn dữ liệu" value={formatNumber(new Set([...data.by_issue,...data.by_reason].map(x=>x.source)).size)} />
        </div>
        {isAdmin && partner === null && data.pipeline && <Section title="Pipeline tổng thể" description="Dữ liệu toàn hệ thống, không bị ảnh hưởng bởi lựa chọn đối tác.">
          <div className="sys-metrics sys-metrics--inside">
            <Metric label="Dòng dữ liệu thô" value={formatNumber(data.pipeline.total_raw)}/>
            <Metric label="Liên hệ duy nhất" value={formatNumber(data.pipeline.unique_contacts)}/>
            <Metric label="Bản ghi được gộp" value={formatNumber(data.pipeline.merged_records)}/>
            <Metric label="Tỷ lệ trùng" value={new Intl.NumberFormat("vi-VN",{style:"percent",maximumFractionDigits:1}).format(data.pipeline.duplicate_rate)}/>
          </div>
        </Section>}
        <div className="sys-two-cols">
          <Section title="Vấn đề đầu vào" description="Tổng số lần ghi nhận theo loại lỗi."><Distribution data={issues}/></Section>
          <Section title="Nguyên nhân gộp trùng" description="Tổng số lần ghi nhận theo lý do."><Distribution data={reasons}/></Section>
        </div>
        <details className="sys-quality-extras">
          <summary>Phân tích bổ sung · Cờ dữ liệu và phân bố hồ sơ</summary>
          <div className="sys-two-cols sys-quality-extras-content">
            <Section title="Cờ cần kiểm tra" description="Số liên hệ theo từng cờ."><Distribution data={data.flags.map(f=>({label:f.key,count:f.count}))}/></Section>
            <Section title="Phân bố hồ sơ gộp" description="Một liên hệ được tổng hợp từ bao nhiêu bản ghi nguồn."><Distribution data={data.merged_distribution.map(f=>({label:`${f.merged} bản ghi`,count:f.count}))}/></Section>
          </div>
        </details>
        <Section title="Nhật ký chi tiết" description="Sử dụng bộ lọc để kiểm tra các dòng nguồn; có phân trang từ máy chủ.">
          <Tabs<Tab> panelId="system-quality-panel" value={tab} onChange={setTab} options={[
            {value:"issues",label:"Chuẩn hóa"},{value:"duplicates",label:"Gộp trùng"},...(isAdmin && partner === null ? [{value:"import" as const,label:"Lần nhập gần nhất"}] : [])
          ]}/>
          <div id="system-quality-panel" className="sys-tab-panel" key={`${tab}-${partner ?? "all"}`} role="tabpanel" tabIndex={0} aria-labelledby={`system-quality-panel-tab-${tab}`}>
            {tab==="import" && isAdmin && partner === null ? <Imports summary={data}/> : <Logs kind={tab==="duplicates"?"duplicates":"issues"} partner={partner} summary={data} refreshSignal={refreshSignal} onBusy={setLogsBusy}/>}
          </div>
        </Section>
      </>}
    </State>
  </div>;
}

export default function Quality(){
  const {user,partner,scopeStatus,retryScope}=useWorkspace();
  if(scopeStatus!=="ready")return <div className="sys-page"><State status={scopeStatus} error="Không xác nhận được phạm vi dữ liệu." retry={retryScope}/></div>;
  return <ScopedQuality key={JSON.stringify([user.username,user.role,user.partner_code,partner,user.can_view_pii])}/>;
}
