import "./system.css";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/expressive/button";
import { useWorkspace } from "@/app/workspace";
import { Dialog, PageHeading, Tabs } from "./components/Elements";
import Users from "./admin/Users";
import Partners from "./admin/Partners";
import DataManagement from "./admin/Data";
import Audit from "./admin/Audit";

type Tab="users"|"partners"|"data"|"audit";
const tabs: Array<{value:Tab;label:string}>=[
  {value:"users",label:"Tài khoản"},
  {value:"partners",label:"Đối tác & quyền"},
  {value:"data",label:"Dữ liệu"},
  {value:"audit",label:"Nhật ký"},
];
export default function Admin(){
  const {user}=useWorkspace();
  const [params,setParams]=useSearchParams();
  const [dirty,setDirty]=useState(false);
  const [pendingTab,setPendingTab]=useState<Tab|null>(null);
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);
  const value=params.get("tab");
  const tab:Tab=tabs.some(t=>t.value===value)?value as Tab:"users";
  if(user.role!=="admin")return <p role="alert">Chỉ quản trị viên được phép truy cập mục này.</p>;
  const navigate=(v:Tab)=>setParams(v==="users"?{}:{tab:v}, {replace:false});
  const change=(v:Tab)=>{
    if (v===tab) return;
    if (dirty) setPendingTab(v);
    else navigate(v);
  };
  return <div className="sys-page">
    <PageHeading title="Quản trị hệ thống" description="Quản lý tài khoản, quyền truy cập, dữ liệu và lịch sử hoạt động."/>
    <Tabs panelId="system-admin-panel" label="Chức năng quản trị" value={tab} options={tabs} onChange={change}/>
    <div id="system-admin-panel" className="sys-admin-panel" key={tab} role="tabpanel" tabIndex={0} aria-label={tabs.find(t=>t.value===tab)?.label}>
      {tab==="users"&&<Users/>}
      {tab==="partners"&&<Partners onDirtyChange={setDirty}/>}
      {tab==="data"&&<DataManagement/>}
      {tab==="audit"&&<Audit/>}
    </div>
    {pendingTab && <Dialog title="Rời trang mà không lưu?" description="Những thay đổi phân quyền hiện tại chưa được gửi đến máy chủ." onClose={()=>setPendingTab(null)}>
      <p className="sys-muted">Bạn có thể tiếp tục chỉnh sửa hoặc bỏ thay đổi và chuyển sang mục khác.</p>
      <div className="sys-dialog-actions"><Button variant="text" onClick={()=>setPendingTab(null)}>Tiếp tục chỉnh sửa</Button>
        <Button onClick={()=>{const next=pendingTab;setPendingTab(null);setDirty(false);navigate(next);}}>Bỏ thay đổi</Button></div>
    </Dialog>}
  </div>;
}
