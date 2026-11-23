import { SystemSelect } from "../components/SystemSelect";
import { useRef, useState, type ChangeEvent } from "react";
import { Database, RefreshCw, RotateCcw, UploadCloud } from "lucide-react";
import { Button } from "@/components/expressive/button";
import { api } from "@/services/api";
import { useResource } from "@/services/useResource";
import type { DataCounts, ImportRun } from "../types";
import { Chip, DataTable, Dialog, formatDate, formatNumber, FormField, Metric, Notice, Section, State } from "../components/Elements";
const FILES=[
  {value:"Demo_Data_khách_hàng.xlsx",label:"Dữ liệu khách hàng / CRM"},
  {value:"Điểm giả lập.xlsx",label:"Dữ liệu điểm thi"},
] as const;
const MAX_BYTES=20*1024*1024; // UX bound only; enforce backend max request size separately.
interface Result {ok:boolean;message:string;counts:Record<string,number>}
export default function DataManagement(){
  const status=useResource<DataCounts>("/admin/data-status");
  const history=useResource<ImportRun[]>("/admin/imports");
  const [target,setTarget]=useState<string>(FILES[0].value);
  const inputFile=useRef<HTMLInputElement>(null);
  const [file,setFile]=useState<File|null>(null);
  const [dialog,setDialog]=useState<"reload"|"upload"|null>(null);
  const [confirmation,setConfirmation]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const counts=status.state==="ready"?status.data:null;
  function updateFile(e:ChangeEvent<HTMLInputElement>){setFile(e.currentTarget.files?.[0]??null);setError("");setSuccess("");}
  function open(kind:"reload"|"upload"){
    setError("");setSuccess("");setConfirmation("");
    if(kind==="upload"){
      if(!file){setError("Vui lòng chọn file trước khi tải lên.");return;}
      if(!/\.xlsx$/i.test(file.name)){setError("Chỉ hỗ trợ file .xlsx trong giao diện này.");return;}
      if(file.size===0||file.size>MAX_BYTES){setError("File phải có dung lượng lớn hơn 0 và không vượt 20 MB.");return;}
    }
    setDialog(kind);
  }
  const confirmationWord = dialog === "upload" ? "THAY THE" : "NAP LAI";
  async function execute(){
    if(!dialog||confirmation!==confirmationWord)return;
    setBusy(true);setError("");
    try{
      let result:Result;
      if(dialog==="reload") result=await api<Result>("/admin/reload-data",{method:"POST"});
      else {
        if(!file)throw new Error("Không có file tải lên.");
        // Only a hardcoded server target is sent; never the local filename.
        result=await api<Result>(`/admin/upload-file?filename=${encodeURIComponent(target)}`,{method:"POST",body:await file.arrayBuffer(),headers:{"Content-Type":"application/octet-stream"}});
      }
      if (!result.ok) throw new Error("Máy chủ chưa xác nhận xử lý dữ liệu.");
      setSuccess(`${result.message} · Contacts ${formatNumber(result.counts.contacts)} · Leads ${formatNumber(result.counts.leads)} · Thí sinh ${formatNumber(result.counts.candidates)}`);
      setDialog(null);setFile(null);if(inputFile.current)inputFile.current.value="";setConfirmation("");status.retry();history.retry();
    }catch(e){setError(e instanceof Error?e.message:"Không thể nạp dữ liệu.");setDialog(null);}
    finally{setBusy(false);}
  }
  return <div className="sys-stack">
    <Notice>Hai tác vụ bên dưới chạy ETL trên máy chủ và có thể ghi lại dữ liệu trong MongoDB. Đây là thao tác thật, không có chế độ xem trước (dry-run) ở API hiện tại. Hãy sao lưu dữ liệu trước khi thực hiện.</Notice>
    {error&&<Notice error>{error}</Notice>}{success&&<Notice success>{success}</Notice>}
    <Section title="Trạng thái dữ liệu" description="Số bản ghi hiện có trong MongoDB (toàn hệ thống)." actions={<Button variant="text" icon={<RefreshCw/>} onClick={()=>{status.retry();history.retry();}}>Cập nhật số liệu</Button>}>
      <State status={status.state} refreshError={status.refreshError} error={status.state==="error"?status.message:undefined} retry={status.retry}>
        {counts && <div className="sys-metrics sys-metrics--inside">
          <Metric label="Liên hệ CRM" value={formatNumber(counts.contacts)}/>
          <Metric label="Đăng ký website" value={formatNumber(counts.signups)}/>
          <Metric label="Lead" value={formatNumber(counts.leads)}/>
          <Metric label="Thí sinh" value={formatNumber(counts.exam_candidates)}/>
          <Metric label="Đầu điểm thi" value={formatNumber(counts.exam_scores)}/>
        </div>}
      </State>
    </Section>
    <div className="sys-two-cols">
      <Section title="Chạy lại pipeline" description="Đọc lại dữ liệu nguồn đã có trên máy chủ rồi chuẩn hóa và nạp vào database.">
        <div className="sys-data-action"><Database size={30} aria-hidden="true" className="text-primary"/>
          <p className="sys-muted">Có thể thay đổi toàn bộ dữ liệu nghiệp vụ và các số liệu trên dashboard.</p>
          <Button icon={<RotateCcw/>} variant="tonal" onClick={()=>open("reload")} disabled={busy}>Nạp lại dữ liệu</Button>
        </div>
      </Section>
      <Section title="Tải lên file nguồn" description="Ghi đè một file nguồn theo tên đích cố định, rồi chạy ETL.">
        <div className="sys-form">
          <SystemSelect label="Loại dữ liệu" value={target} options={FILES.map(f=>({value:f.value,label:f.label}))} onChange={setTarget}/>
          <FormField label="File Excel (.xlsx)" hint="Giới hạn 20 MB trong giao diện. Server cần giới hạn dung lượng riêng."><input ref={inputFile} type="file" className="sys-input sys-file" onChange={updateFile} accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"/></FormField>
          {file&&<p className="sys-muted">{file.name} · {formatNumber(file.size)} bytes</p>}
          <Button icon={<UploadCloud/>} variant="tonal" disabled={!file||busy} onClick={()=>open("upload")}>Tải lên và xử lý</Button>
        </div>
      </Section>
    </div>
    <Section title="Lịch sử nhập dữ liệu" description="Mười lần xử lý gần nhất mà backend đã ghi nhận.">
      <State status={history.state} refreshError={history.refreshError} error={history.state==="error"?history.message:undefined} retry={history.retry}>
        {history.state==="ready"&&<DataTable rows={history.data} rowKey={(r,i)=>`${r.started_at??"import"}-${i}`} columns={[
          {key:"started",heading:"Bắt đầu",get:r=>formatDate(r.started_at)},
          {key:"ended",heading:"Kết thúc",get:r=>formatDate(r.finished_at)},
          {key:"result",heading:"Kết quả",get:r=><Chip kind={r.ok?"good":"bad"}>{r.ok?"Thành công":"Có lỗi"}</Chip>},
          {key:"files",heading:"Nguồn",get:r=>(r.files??[]).map(f=>f.name).join(", ")||"—"},
          {key:"checks",heading:"Kiểm tra",get:r=>`${(r.checks??[]).filter(c=>c.ok).length}/${(r.checks??[]).length} khớp`},
        ]}/>}
      </State>
    </Section>
    {dialog&&<Dialog dismissible={!busy} title={dialog==="reload"?"Xác nhận nạp lại toàn bộ dữ liệu":"Xác nhận thay thế file nguồn"} description="Hành động có thể làm thay đổi dữ liệu đang được sử dụng trong dashboard." onClose={()=>!busy&&setDialog(null)}>
      <div className="sys-stack">
        <Notice error>Thao tác này ghi dữ liệu vào MongoDB ngay sau khi xác nhận. API chưa có chức năng xem trước tác động hoặc hoàn tác.</Notice>
        {dialog==="upload"&&<p>File: <b>{file?.name}</b><br/>Tên nguồn trên server: <b>{target}</b></p>}
        <FormField label={`Gõ ${confirmationWord} để xác nhận`}><input className="sys-input" autoComplete="off" value={confirmation} onChange={e=>setConfirmation(e.target.value)} placeholder={confirmationWord}/></FormField>
        <div className="sys-dialog-actions"><Button variant="text" disabled={busy} onClick={()=>setDialog(null)}>Hủy</Button><Button disabled={busy||confirmation!==confirmationWord} onClick={execute}>{busy?"Đang xử lý…":"Xác nhận thực hiện"}</Button></div>
      </div>
    </Dialog>}
  </div>;
}
