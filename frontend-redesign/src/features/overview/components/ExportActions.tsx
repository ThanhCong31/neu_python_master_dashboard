import { useLayoutEffect, useRef, useState } from 'react';
import { Download, ChevronDown, FileSpreadsheet, FileText, File } from 'lucide-react';
import { Button } from '@/components/expressive/button';
import { Menu, MenuTrigger, MenuContent, MenuItem } from '@/components/expressive/menu';
import { apiFile } from '@/services/api';
import { reportPath, reportMimeValid } from '../model';
const formats = [
  {id:'xlsx',label:'Excel',description:'Phân tích dữ liệu',Icon:FileSpreadsheet},
  {id:'docx',label:'Word',description:'Báo cáo có thể chỉnh sửa',Icon:FileText},
  {id:'pdf',label:'PDF',description:'Chia sẻ và in ấn',Icon:File},
] as const;
type Format = typeof formats[number]['id'];
export function ExportActions({ partner, disabled }: { partner: string | null; disabled: boolean }) {
  const [busy,setBusy] = useState<Format | null>(null);
  const [message,setMessage] = useState('');
  const [failed,setFailed] = useState(false);
  const active = useRef<AbortController | null>(null);
  useLayoutEffect(()=>()=>active.current?.abort(),[]);
  async function download(format: Format) {
    if (active.current || disabled) return;
    const controller = new AbortController(); active.current = controller;
    setBusy(format); setMessage(''); setFailed(false);
    try {
      const blob = await apiFile(reportPath(format,partner),{signal:controller.signal});
      if(controller.signal.aborted) return;
      if(!blob.size || !reportMimeValid(format,blob.type)) throw new Error('Máy chủ không trả về tệp báo cáo hợp lệ.');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href=url; link.download=`bao-cao-tong-quan.${format}`;
      document.body.append(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
      setMessage('Đã gửi yêu cầu lưu báo cáo tới trình duyệt.');
    } catch(error) {
      if(!controller.signal.aborted) { setFailed(true); setMessage(error instanceof Error ? error.message : 'Không xuất được báo cáo.'); }
    } finally { if(active.current===controller){active.current=null; if(!controller.signal.aborted)setBusy(null);} }
  }
  return <div className="ov-export">
    <Menu>
      <MenuTrigger disabled={disabled||busy!==null} render={<Button variant="tonal" size="sm" disabled={disabled||busy!==null} icon={<Download aria-hidden="true"/>}/>}>
        {busy?'Đang xuất…':'Xuất báo cáo'} <ChevronDown aria-hidden="true"/>
      </MenuTrigger>
      <MenuContent align="end" sideOffset={8} className="ov-export-menu">
        {formats.map(f=><MenuItem key={f.id} icon={<f.Icon aria-hidden="true"/>} supportingText={f.description} trailing={`.${f.id}`} disabled={disabled||busy!==null} onClick={()=>void download(f.id)}>{f.label}</MenuItem>)}
      </MenuContent>
    </Menu>
    {busy&&<p role="status" className="ov-note">Đang xuất {formats.find(f=>f.id===busy)?.label}…</p>}
    {message&&<p role={failed?'alert':'status'} className={failed?'ov-error':'ov-note'}>{message}</p>}
  </div>;
}
