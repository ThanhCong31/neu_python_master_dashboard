import "./system.css";
import { useBlocker, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/expressive/button";
import { useWorkspace } from "@/app/workspace";
import { Dialog, Tabs } from "./components/Elements";
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
  const [busy,setBusy]=useState(false);
  const blocker=useBlocker(({currentLocation,nextLocation})=>(dirty||busy) &&
    (currentLocation.pathname!==nextLocation.pathname || currentLocation.search!==nextLocation.search));
  useEffect(() => {
    if (!dirty && !busy) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", beforeUnload);
    const beforeSignOut=(event:Event)=>{
      if(busy || !window.confirm("Bạn có thay đổi phân quyền chưa lưu. Đăng xuất và bỏ thay đổi?"))event.preventDefault();
    };
    window.addEventListener("neu-before-sign-out",beforeSignOut);
    return () => {window.removeEventListener("beforeunload", beforeUnload);window.removeEventListener("neu-before-sign-out",beforeSignOut);};
  }, [dirty,busy]);
  const value=params.get("tab");
  const tab:Tab=tabs.some(t=>t.value===value)?value as Tab:"users";
  if(user.role!=="admin")return <p role="alert">Chỉ quản trị viên được phép truy cập mục này.</p>;
  const navigate=(v:Tab)=>setParams(v==="users"?{}:{tab:v}, {replace:false});
  const change=(v:Tab)=>{
    if (v===tab) return;
    navigate(v);
  };
  return <div className="sys-page">
    <p className="sys-muted">Quản lý tài khoản, quyền truy cập, dữ liệu và lịch sử hoạt động.</p>
    <Tabs panelId="system-admin-panel" label="Chức năng quản trị" value={tab} options={tabs} onChange={change}/>
    <div id="system-admin-panel" className="sys-admin-panel" key={tab} role="tabpanel" tabIndex={0} aria-labelledby={`system-admin-panel-tab-${tab}`}>
      {tab==="users"&&<Users onBusyChange={setBusy}/>}
      {tab==="partners"&&<Partners onDirtyChange={setDirty} onBusyChange={setBusy}/>}
      {tab==="data"&&<DataManagement onBusyChange={setBusy}/>}
      {tab==="audit"&&<Audit/>}
    </div>
    {blocker.state==="blocked" && <Dialog title={busy?"Đang xử lý trên máy chủ":"Rời trang mà không lưu?"} description={busy?"Chờ máy chủ phản hồi trước khi chuyển trang.":"Thay đổi chưa lưu sẽ bị bỏ qua nếu tiếp tục."} onClose={()=>blocker.reset()}>
      <div className="sys-dialog-actions"><Button variant="text" onClick={()=>blocker.reset()}>Ở lại</Button>
        {!busy&&<Button onClick={()=>{setDirty(false);blocker.proceed();}}>{dirty?"Bỏ thay đổi và rời trang":"Rời trang"}</Button>}</div>
    </Dialog>}
  </div>;
}
