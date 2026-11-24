import './data-workspace.css';
import {useLayoutEffect,useRef,useState} from 'react';
import {Download} from 'lucide-react';
import {Button} from '@/components/expressive/button';
import {apiFile} from '@/services/api';
export function CsvDownload({path,disabled,filename,confirmMessage}:{path:string;disabled:boolean;filename:string;confirmMessage?:string}) {
  const active=useRef<AbortController|null>(null);const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [error,setError]=useState(false);
  useLayoutEffect(()=>{setBusy(false);setMessage('');return()=>{active.current?.abort();active.current=null;};},[path,disabled,filename,confirmMessage]);
  async function run(){if(disabled||active.current)return;if(confirmMessage&&!window.confirm(confirmMessage))return;const controller=new AbortController();active.current=controller;setBusy(true);setMessage('');setError(false);
    try{const blob=await apiFile(path,{signal:controller.signal});if(controller.signal.aborted)return;
      if(!blob.size||!(/^(text\/csv|application\/csv|application\/octet-stream)(;|$)/i.test(blob.type)))throw new Error('Máy chủ không trả về tệp CSV hợp lệ.');
      const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage('Đã gửi yêu cầu lưu CSV tới trình duyệt.');
    }catch(e){if(!controller.signal.aborted){setError(true);setMessage(e instanceof Error?e.message:'Không thể xuất CSV.');}}
    finally{if(active.current===controller){active.current=null;setBusy(false);}}
  }
  return <div className="dw-export"><Button motion="standard" variant="tonal" icon={<Download/>} disabled={disabled||busy} onClick={()=>void run()}>{busy?'Đang xuất…':'Xuất CSV'}</Button>{message&&<p className={error?'dw-error':'dw-note'} role={error?'alert':'status'}>{message}</p>}</div>;
}
