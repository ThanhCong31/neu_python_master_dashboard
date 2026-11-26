import { SystemSelect } from "../components/SystemSelect";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { TextField } from "@/components/expressive/text-field";
import { RefreshButton } from "@/shared/PageActions";
import { useResource } from "@/services/useResource";
import type { AuditEvent } from "../types";
import { Chip, DataTable, formatDate, Pager, Section, State } from "../components/Elements";
const ACTIONS:Record<string,string>={login:"Đăng nhập",change_password:"Đổi mật khẩu",user_create:"Tạo tài khoản",user_update:"Sửa tài khoản",user_reset_password:"Đặt lại mật khẩu",partner_update:"Sửa quyền đối tác",data_reload:"Nạp lại dữ liệu",data_upload:"Tải lên file"};
const PAGE=25;
const DETAIL_LABELS: Record<string,string> = {
  target:"Tài khoản liên quan", partner:"Đối tác", active:"Hoạt động", modules:"Quyền module",
  can_view_pii:"Được xem dữ liệu cá nhân", filename:"File nguồn", reason:"Lý do",
  contacts:"Liên hệ", leads:"Lead", candidates:"Thí sinh",
};
function AuditDetails({ detail }: { detail: Record<string,unknown> }) {
  const entries = Object.entries(detail ?? {});
  return <details className="sys-details"><summary>Xem chi tiết</summary>
    {entries.length ? <dl className="sys-audit-detail">{entries.map(([key,value]) => <div key={key}>
      <dt>{DETAIL_LABELS[key] ?? key.replaceAll("_", " ")}</dt>
      <dd>{typeof value === "boolean" ? value ? "Có" : "Không" : Array.isArray(value) ? value.map(String).join(", ") : value !== null && typeof value === "object" ? JSON.stringify(value) : String(value ?? "—")}</dd>
    </div>)}</dl> : <p className="sys-muted">Không có thông tin bổ sung.</p>}
  </details>;
}
export default function Audit(){
  const data=useResource<AuditEvent[]>("/admin/audit?limit=200");
  const [action,setAction]=useState("");const [status,setStatus]=useState("");const [search,setSearch]=useState("");const [page,setPage]=useState(1);
  const all=data.state==="ready"?data.data:[];
  const actions=useMemo(()=>[...new Set(all.map(r=>r.action))].sort(),[all]);
  const rows=useMemo(()=>all.filter(r=>(!action||r.action===action)&&(!status||(status==="ok"?r.ok:!r.ok))&&`${r.username??""} ${r.ip??""}`.toLowerCase().includes(search.toLowerCase())),[all,action,status,search]);
  useEffect(() => {
    const last = Math.max(1, Math.ceil(rows.length / PAGE));
    if (page > last) setPage(last);
  }, [page, rows.length]);
  const current=rows.slice((page-1)*PAGE,page*PAGE);
  return <Section title="Nhật ký truy cập" description="200 sự kiện gần đây nhất từ máy chủ. Bộ lọc bên dưới áp dụng trên 200 sự kiện này." actions={<RefreshButton busy={data.state==="loading"||data.refreshing} onRefresh={data.retry} label="Làm mới nhật ký"/>}>
    <div className="sys-stack">
      <div className="sys-filters sys-filters--three">
        <SystemSelect labelPlacement="above" label="Hành động" value={action} allLabel="Tất cả hành động" options={actions.map(a=>({value:a,label:ACTIONS[a]??a}))} onChange={value=>{setAction(value);setPage(1);}} />
        <SystemSelect labelPlacement="above" label="Kết quả" value={status} allLabel="Tất cả kết quả" options={[{value:"ok",label:"Thành công"},{value:"fail",label:"Thất bại"}]} onChange={value=>{setStatus(value);setPage(1);}} />
        <TextField variant="search" label="Tài khoản / IP" leadingIcon={<Search aria-hidden="true"/>} value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} type="search" placeholder="Tên tài khoản hoặc địa chỉ IP" />
      </div>
      <State status={data.state} refreshError={data.refreshError} error={data.state==="error"?data.message:undefined} retry={data.retry}>
        <DataTable rows={current} rowKey={(r,i)=>`${r.at}-${r.action}-${i}`} columns={[
          {key:"at",heading:"Thời điểm",get:r=>formatDate(r.at)},
          {key:"action",heading:"Hành động",get:r=><strong>{ACTIONS[r.action]??r.action}</strong>},
          {key:"user",heading:"Tài khoản",get:r=>r.username?`@${r.username}`:"—"},
          {key:"result",align:"center",heading:"Kết quả",get:r=><Chip kind={r.ok?"good":"bad"}>{r.ok?"Thành công":"Thất bại"}</Chip>},
          {key:"ip",heading:"IP",get:r=>r.ip??"—"},
          {key:"detail",heading:"Chi tiết",get:r=><AuditDetails detail={r.detail??{}}/>}
        ]}/>
        <Pager page={page} total={rows.length} pageSize={PAGE} onPage={setPage}/>
      </State>
    </div>
  </Section>;
}
