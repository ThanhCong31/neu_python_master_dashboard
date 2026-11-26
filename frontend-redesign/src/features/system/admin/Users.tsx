import { SystemSelect } from "../components/SystemSelect";
import { useLayoutEffect, useMemo, useState, type FormEvent } from "react";
import { LockKeyhole, Plus, Search, UserRoundPen } from "lucide-react";
import { Button } from "@/components/expressive/button";
import { TextField } from "@/components/expressive/text-field";
import { useWorkspace } from "@/app/workspace";
import { api, ApiError } from "@/services/api";
import { useResource } from "@/services/useResource";
import type { AdminUser, PartnersResult } from "../types";
import { Chip, DataTable, Dialog, formatDate, Notice, Section, State } from "../components/Elements";

type Editor = { type:"create" } | { type:"edit"; user:AdminUser } | {type:"password";user:AdminUser} | {type:"status";user:AdminUser};
const validUsername = /^[a-z0-9._-]{3,32}$/;
function errorText(e:unknown) { return e instanceof Error ? e.message : "Thao tác thất bại. Vui lòng thử lại."; }
function UserEditor({mode,partners,done,onClose,onBusyChange}:{mode:{type:"create"}|{type:"edit";user:AdminUser};partners:PartnersResult;done:(message:string)=>void;onClose:()=>void;onBusyChange?:(busy:boolean)=>void}) {
  const original=mode.type==="edit"?mode.user:null;
  const [username,setUsername]=useState("");
  const [name,setName]=useState(original?.full_name??"");
  const [role,setRole]=useState<"partner"|"admin">(original?.role??"partner");
  const partnerChoices = partners.partners.filter(item => item.active || item.code === original?.partner_code);
  const [partner,setPartner]=useState(original?.partner_code??partnerChoices[0]?.code??"");
  const [password,setPassword]=useState("");
  const [busy,setBusy]=useState(false);
  useLayoutEffect(()=>{onBusyChange?.(busy);return()=>onBusyChange?.(false);},[busy,onBusyChange]);
  const [error,setError]=useState("");
  const edit=!!original;
  async function submit(e:FormEvent) {
    e.preventDefault();if(busy)return;setError("");
    if (!edit && !validUsername.test(username)) {setError("Tên đăng nhập chỉ gồm chữ thường, số và . _ - (3–32 ký tự).");return;}
    if (!name.trim()) {setError("Họ tên hoặc đơn vị không được để trống.");return;}
    if (role==="partner" && !partner) {setError("Vui lòng chọn đối tác.");return;}
    setBusy(true);
    try {
      if (original) {
        const saved = await api<AdminUser>(`/admin/users/${encodeURIComponent(original.username)}`,{method:"PATCH",json:{full_name:name.trim(),...(original.role==="partner"?{partner_code:partner}:{})}});
        if (saved.full_name !== name.trim() || (original.role==="partner" && saved.partner_code !== partner))
          throw new Error("Máy chủ chưa xác nhận thông tin vừa cập nhật. Hãy làm mới danh sách để kiểm tra.");
      } else {
        const requestedName = username.trim().toLowerCase();
        let created: AdminUser | null = null;
        try {
          created = await api<AdminUser>("/admin/users",{method:"POST",json:{username:requestedName,full_name:name.trim(),role,partner_code:role==="partner"?partner:null,password}});
        } catch (requestError) {
          // Existing backend may insert a document and then fail while serializing
          // the POST response. A read-only follow-up avoids a misleading retry
          // that could create a duplicate or cause a confusing 409 conflict.
          if (!(requestError instanceof ApiError) || requestError.status !== 500) throw requestError;
          const after = await api<AdminUser[]>("/admin/users");
          created = after.find((item) => item.username === requestedName && item.role === role &&
            item.full_name === name.trim() && item.partner_code === (role === "partner" ? partner : null)) ?? null;
          if (!created) throw requestError;
          done("Tài khoản đã có trên máy chủ sau khi gửi yêu cầu. Đã kiểm tra lại trong danh sách tài khoản.");
          return;
        }
        if (!created || created.username !== requestedName || created.role !== role)
          throw new Error("Chưa xác nhận được tài khoản mới từ máy chủ. Vui lòng kiểm tra danh sách trước khi gửi lại.");
      }
      done(edit?"Đã lưu thông tin tài khoản.":"Đã tạo tài khoản mới.");
    } catch(err) {setError(errorText(err));} finally {setBusy(false);}
  }
  return <Dialog dismissible={!busy} title={edit?`Chỉnh sửa @${original.username}`:"Tạo tài khoản"} description="Thay đổi được lưu trực tiếp lên máy chủ." onClose={onClose}>
    <form onSubmit={submit} className="sys-form" aria-busy={busy}>
      {!edit && <TextField label="Tên đăng nhập" value={username} onChange={e=>setUsername(e.target.value)} required minLength={3} maxLength={32} autoComplete="off"/>}
      <TextField label="Họ tên / đơn vị" value={name} onChange={e=>setName(e.target.value)} required minLength={1} maxLength={120}/>
      <SystemSelect native label="Vai trò" labelBackground="var(--ex-color-surface-container-high)" value={role} disabled={edit} options={[{value:"partner",label:"Đối tác"},{value:"admin",label:"Quản trị viên"}]} onChange={value=>setRole(value as "admin"|"partner")}/>
      {role==="partner" && <SystemSelect native label="Đối tác" labelBackground="var(--ex-color-surface-container-high)" value={partner} options={partnerChoices.map(p=>({value:p.code,label:`${p.code} · ${p.name}`}))} onChange={setPartner} />}
      {!edit && <TextField label="Mật khẩu ban đầu" type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={8} maxLength={128} autoComplete="new-password" required supportingText="Tối thiểu 8 ký tự, kết hợp chữ và số hoặc ký tự đặc biệt."/>}
      {error && <Notice error>{error}</Notice>}
      <div className="sys-dialog-actions"><Button type="button" variant="text" disabled={busy} onClick={onClose}>Hủy</Button><Button type="submit" disabled={busy}>{busy?"Đang lưu…":edit?"Lưu thay đổi":"Tạo tài khoản"}</Button></div>
    </form>
  </Dialog>;
}
export function PasswordReset({user,done,onClose,onBusyChange}:{user:AdminUser;done:(s:string)=>void;onClose:()=>void;onBusyChange?:(busy:boolean)=>void}){
  const [password,setPassword]=useState("");const [confirm,setConfirm]=useState("");const [busy,setBusy]=useState(false);
  useLayoutEffect(()=>{onBusyChange?.(busy);return()=>onBusyChange?.(false);},[busy,onBusyChange]);
  const [error,setError]=useState("");
  async function submit(e:FormEvent){e.preventDefault();if(busy)return;setError("");if(password!==confirm){setError("Hai mật khẩu không khớp.");return;}setBusy(true);
    try{const result=await api<{ok:boolean}>(`/admin/users/${encodeURIComponent(user.username)}/reset-password`,{method:"POST",json:{password}});
      if(!result.ok) throw new Error("Máy chủ chưa xác nhận đặt lại mật khẩu.");
      done(`Đã đặt lại mật khẩu cho @${user.username}; các phiên cũ đã hết hiệu lực.`);}
    catch(err){setError(errorText(err));}finally{setBusy(false);}}
  return <Dialog dismissible={!busy} title={`Đặt lại mật khẩu · @${user.username}`} description="Sau thao tác, những phiên đăng nhập cũ của tài khoản này sẽ bị vô hiệu hóa." onClose={onClose}>
    <form className="sys-form" onSubmit={submit} aria-busy={busy}>
      <TextField label="Mật khẩu mới" type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} maxLength={128} autoComplete="new-password"/>
      <TextField label="Xác nhận mật khẩu" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required minLength={8} autoComplete="new-password"/>
      {error && <Notice error>{error}</Notice>}
      <div className="sys-dialog-actions"><Button type="button" variant="text" disabled={busy} onClick={onClose}>Hủy</Button><Button type="submit" disabled={busy}> {busy?"Đang xử lý…":"Đặt lại mật khẩu"}</Button></div>
    </form>
  </Dialog>;
}
function StatusChange({user,done,onClose,onBusyChange}:{user:AdminUser;done:(s:string)=>void;onClose:()=>void;onBusyChange?:(busy:boolean)=>void}){
  const [busy,setBusy]=useState(false);
  useLayoutEffect(()=>{onBusyChange?.(busy);return()=>onBusyChange?.(false);},[busy,onBusyChange]);
  const [error,setError]=useState("");const next=!user.active;
  async function submit(){if(busy)return;setBusy(true);setError("");try{const result=await api<AdminUser>(`/admin/users/${encodeURIComponent(user.username)}`,{method:"PATCH",json:{active:next}});
      if(result.active!==next) throw new Error("Máy chủ chưa xác nhận thay đổi trạng thái tài khoản.");
      done(`Đã ${next?"mở khóa":"khóa"} @${user.username}.`);}catch(err){setError(errorText(err));}finally{setBusy(false);}}
  return <Dialog dismissible={!busy} title={`${next?"Mở khóa":"Khóa"} tài khoản @${user.username}?`} description={next?"Tài khoản sẽ có thể đăng nhập trở lại.":"Tài khoản sẽ không thể đăng nhập và các phiên hiện có bị vô hiệu hóa."} onClose={onClose}>
    {error && <Notice error>{error}</Notice>}
    <div className="sys-dialog-actions"><Button variant="text" disabled={busy} onClick={onClose}>Hủy</Button><Button disabled={busy} onClick={submit}>{busy?"Đang cập nhật…":next?"Xác nhận mở khóa":"Xác nhận khóa"}</Button></div>
  </Dialog>;
}
export default function Users({onBusyChange}:{onBusyChange?:(busy:boolean)=>void}={}){
  const {user:current}=useWorkspace();
  const users=useResource<AdminUser[]>("/admin/users");
  const partners=useResource<PartnersResult>("/admin/partners");
  const [editor,setEditor]=useState<Editor|null>(null);
  const [search,setSearch]=useState("");
  const [notice,setNotice]=useState("");
  const items=users.state==="ready"?users.data:[];
  const filtered=useMemo(()=>items.filter(u=>`${u.username} ${u.full_name} ${u.partner_code??""}`.toLocaleLowerCase("vi").includes(search.trim().toLocaleLowerCase("vi"))),[items,search]);
  const partnerList=partners.state==="ready"?partners.data:null;
  function done(s:string){setEditor(null);setNotice(s);users.retry();partners.retry();}
  return <Section title="Tài khoản đăng nhập" description="Tài khoản, trạng thái và đối tác được quản lý trực tiếp qua API."
    actions={<Button icon={<Plus/>} onClick={()=>setEditor({type:"create"})} disabled={!partnerList}>Tạo tài khoản</Button>}>
    <div className="sys-stack">
      {notice && <Notice success>{notice}</Notice>}
      <div className="sys-toolbar"><TextField className="sys-account-search" variant="search" label="Tên đăng nhập, họ tên, mã đối tác" leadingIcon={<Search aria-hidden="true"/>} value={search} onChange={e=>setSearch(e.target.value)} type="search"/></div>
      {partners.state==="error" && <Notice error>Không thể tải danh sách đối tác: {partners.message} <Button size="xs" variant="outlined" onClick={partners.retry}>Thử lại</Button></Notice>}
      <State status={users.state} refreshError={users.refreshError} error={users.state==="error"?users.message:undefined} retry={users.retry}>
        <DataTable rows={filtered} rowKey={u=>u.username} columns={[
          {key:"username",heading:"Tài khoản",get:u=><><strong>@{u.username}</strong><span className="sys-table-secondary">{u.full_name}</span></>},
          {key:"role",align:"center",heading:"Vai trò",get:u=><Chip kind={u.role==="admin"?"accent":"neutral"}>{u.role==="admin"?"Quản trị":"Đối tác"}</Chip>},
          {key:"partner",heading:"Đối tác",get:u=>u.partner_code ? `${u.partner_code} · ${partnerList?.partners.find(p=>p.code===u.partner_code)?.name??u.partner_code}` : "—"},
          {key:"status",align:"center",heading:"Trạng thái",get:u=><Chip kind={u.active?"good":"bad"}>{u.active?"Hoạt động":"Đã khóa"}</Chip>},
          {key:"last",heading:"Đăng nhập gần nhất",get:u=>formatDate(u.last_login)},
          {key:"actions",heading:"Thao tác",get:u=><div className="sys-actions sys-actions--wrap">
            <Button variant="text" size="sm" icon={<UserRoundPen/>} onClick={()=>setEditor({type:"edit",user:u})} disabled={!partnerList}>Sửa</Button>
            <Button variant="text" size="sm" icon={<LockKeyhole/>} onClick={()=>setEditor({type:"password",user:u})}>Mật khẩu</Button>
            {u.username!==current.username && <Button variant="outlined" size="sm" onClick={()=>setEditor({type:"status",user:u})}>{u.active?"Khóa":"Mở khóa"}</Button>}
          </div>}
        ]}/>
      </State>
    </div>
    {editor?.type==="create" && partnerList && <UserEditor mode={editor} partners={partnerList} onClose={()=>setEditor(null)} done={done} onBusyChange={onBusyChange}/>}
    {editor?.type==="edit" && partnerList && <UserEditor mode={editor} partners={partnerList} onClose={()=>setEditor(null)} done={done} onBusyChange={onBusyChange}/>}
    {editor?.type==="password" && <PasswordReset user={editor.user} onClose={()=>setEditor(null)} done={done} onBusyChange={onBusyChange}/>}
    {editor?.type==="status" && <StatusChange user={editor.user} onClose={()=>setEditor(null)} done={done} onBusyChange={onBusyChange}/>}
  </Section>;
}
