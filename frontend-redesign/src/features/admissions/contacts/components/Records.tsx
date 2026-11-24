import { LoadingState } from "@/shared/LoadingState";
import { RecordTable, RecordList, WorkspacePagination, type RecordColumn } from '@/shared/DataWorkspace';
import { WorkspaceSelect } from '@/shared/WorkspaceSelect';
import { IconButton } from '@/components/expressive/icon-button';
import { Checkbox } from '@/components/expressive/checkbox';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {ChevronRight,Columns3,Search} from 'lucide-react';
import {Button} from '@/components/expressive/button';
import {TextField} from '@/components/expressive/text-field';
import {dateText,moneyText,numberText} from '@/shared/format';
import type {useResource} from '@/services/useResource';
import {layoutForWidth,textValue,type ContactList,type ContactRow} from '../model';
import {pageCount,sortFields,validSort} from '../query';
import {ContactDetail,Payment} from './ContactDetail';
import {Dialog} from './Dialog';
import {ExportCsv} from './ExportCsv';
export type ListControls={page:number;size:number;sort:string};
const columns:RecordColumn<ContactRow>[]=[
  {key:'identity',label:'Họ tên / Mã',sort:'full_name',render:r=><div className="ct-identity"><strong>{r.full_name||'Chưa có họ tên'}</strong><small>{r.contact_id}</small></div>},
  {key:'board',align:'center',label:'Bảng thi',sort:'board',render:r=>textValue(r.board)},
  {key:'payment',label:'Thanh toán',sort:'payment_status',render:r=><div className="ct-payment-cell"><Payment status={r.payment_status}/><small>{moneyText(r.revenue)}</small></div>},
  {key:'pic',label:'Phụ trách',sort:'pic',render:r=>r.pic||'Chưa phân công'},
  {key:'province',label:'Tỉnh/thành',sort:'province',render:r=>textValue(r.province)},
  {key:'channel',label:'Kênh ghi nhận',sort:'channel',render:r=><>{textValue(r.channel)}{r.channel_is_assumed&&<small> · Giả định</small>}</>},
  {key:'segment',label:'Nhóm CRM',sort:'segment',render:r=>textValue(r.segment)},
  {key:'first_touch',label:'Tiếp xúc đầu',sort:'first_touch',render:r=>r.first_touch?dateText(r.first_touch):'—'},
  {key:'web_registered_at',label:'Đăng ký web',sort:'web_registered_at',render:r=>r.web_registered_at?dateText(r.web_registered_at):'—'},
  {key:'venue',label:'Điểm thi',render:r=>textValue(r.exam_venue)},
  {key:'flags',align:'center',label:'Cờ kiểm tra',render:r=>Array.isArray(r.flags)?numberText(r.flags.length):'—'},
  {key:'email',label:'Email',render:r=>textValue(r.email)},
  {key:'phone',label:'Điện thoại',render:r=>textValue(r.phone)},
];
function RowAction({row,onClick}:{row:ContactRow;onClick:()=>void}) {return <IconButton className="dw-row-action" variant="standard" motion="standard" aria-label={`Xem chi tiết ${row.full_name||row.contact_id} (${row.contact_id})`} onClick={onClick}><ChevronRight aria-hidden="true"/></IconButton>;}
export function Records({path,csvPath,controls,onControls,search,onSearch,pending,canViewPii,filterOpen,resource,onReset,hasFilters}:{path:string|null;csvPath:string;controls:ListControls;onControls:(c:ListControls)=>void;search:string;onSearch:(s:string)=>void;pending:boolean;canViewPii:boolean;filterOpen:boolean;resource:ReturnType<typeof useResource<ContactList>>;onReset:()=>void;hasFilters:boolean}) {
  const {page,size,sort}=controls;
  const data=resource.state==='ready'?resource.data:null;const pages=data?pageCount(data.total,size):1;
  const [detail,setDetail]=useState<{path:string;id:string}|null>(null);const row=detail?.path===path?data?.rows.find(r=>r.contact_id===detail?.id):undefined;
  const [columnOpen,setColumnOpen]=useState(false);const [extra,setExtra]=useState<string[]>([]);const [hidePic,setHidePic]=useState(false);
  const container=useRef<HTMLElement>(null);const [layout,setLayout]=useState<'compact'|'medium'|'expanded'>('compact');
  useLayoutEffect(()=>{const el=container.current;if(!el)return;const measure=()=>setLayout(layoutForWidth(el.clientWidth));measure();const observer=new ResizeObserver(measure);observer.observe(el);return()=>observer.disconnect();},[]);
  useEffect(()=>{if(layout==='compact')setColumnOpen(false);},[layout]);
  useEffect(()=>{if(data&&page>pages)onControls({...controls,page:pages});},[data,page,pages]);
  useEffect(()=>{setDetail(null);},[path]);
  const activeCols=columns.filter(c=>['identity','board','payment'].includes(c.key)||(c.key==='pic'?!hidePic&&(layout==='expanded'||extra.includes('pic')):extra.includes(c.key)));
  const setSort=(s:string)=>onControls({...controls,sort:validSort(s),page:1});
  const disabled=!data||!data.total||pending||resource.refreshing||!!resource.refreshError||filterOpen||!path||page>pages;
  const rowKey=(r:ContactRow)=>r.contact_id;
  const action=(r:ContactRow)=>path&&<RowAction row={r} onClick={()=>setDetail({path,id:r.contact_id})}/>;
  return <section className="ct-panel ct-records" ref={container} aria-label="Danh sách liên hệ">
    <div className="ct-panel-head"><h2>Danh sách liên hệ</h2><span className="ct-count" role="status">{data?`${numberText(data.total)} hồ sơ phù hợp`:resource.state==='error'?'Chưa tải được số hồ sơ':path?'Đang xác định số hồ sơ':'Chưa có kết quả'}</span></div>
    <div className="dw-record-toolbar"><TextField className="dw-search" label="Tìm mã, họ tên, email" variant="search" leadingIcon={<Search aria-hidden="true"/>} value={search} maxLength={80} onChange={e=>onSearch(e.target.value)}/><WorkspaceSelect label="Sắp xếp" value={sort} options={sortFields.flatMap(([key,label])=>[{value:key,label:`${label} ↑`},{value:`-${key}`,label:`${label} ↓`}])} onChange={setSort}/><div className="dw-tool-actions">{layout!=='compact'&&<Button motion="standard" variant="outlined" icon={<Columns3/>} onClick={()=>setColumnOpen(true)}>Cột</Button>}<ExportCsv key={csvPath} path={csvPath} disabled={disabled}/></div></div>
    <p className="ct-note">Tìm kiếm chỉ áp dụng cho danh sách và CSV.</p>
    {resource.refreshing&&<p role="status" className="ct-note">Đang cập nhật hồ sơ…</p>}{pending&&<p role="status" className="ct-note">Đang cập nhật tìm kiếm…</p>}
    {resource.refreshError&&<p role="alert" className="ct-error">{resource.refreshError} · Đang hiển thị dữ liệu lần tải trước.</p>}
    {!path?<div className="ct-state">Hãy kiểm tra bộ lọc hoặc phạm vi dữ liệu.</div>:resource.state==='error'?<div className="ct-state"><p role="alert">{resource.message}</p><Button motion="standard" variant="tonal" onClick={resource.retry}>Thử lại</Button></div>:!data||page>pages?<LoadingState label="Đang tải hồ sơ…"/>:data.rows.length===0?<div className="ct-state"><h3>{hasFilters||search?"Không tìm thấy hồ sơ phù hợp":"Không có hồ sơ trong phạm vi này"}</h3>{(hasFilters||search)&&<><p className="ct-note">Thử thay đổi tìm kiếm hoặc bộ lọc.</p><Button motion="standard" variant="tonal" onClick={onReset}>Xóa lọc và tìm kiếm</Button></>}</div>:layout==='compact'?<RecordList rows={data.rows} rowKey={rowKey} render={r=><><strong>{r.full_name||'Chưa có họ tên'}</strong><small>{r.contact_id} · {textValue(r.board)}</small><div className="ct-list-payment"><Payment status={r.payment_status}/><span>{moneyText(r.revenue)}</span></div><small>{r.pic||'Chưa phân công'}</small></>} action={action}/>:<RecordTable rows={data.rows} columns={activeCols} rowKey={rowKey} sort={sort} onSort={setSort} action={action} label="Bảng liên hệ, có thể cuộn ngang" className={extra.length?'ct-extra':'ct-essential'}/>}
    {data&&data.total>0&&page<=pages&&<WorkspacePagination page={page} pages={pages} size={size} total={data.total} unit="hồ sơ" pending={pending} onPage={page=>onControls({...controls,page})} onSize={size=>onControls({...controls,size,page:1})}/>}
    <p className="ct-note">CSV gồm tất cả hồ sơ phù hợp, theo thứ tự mã hồ sơ; không chỉ trang hiện tại.</p>
    {columnOpen&&layout!=='compact'&&<Dialog title="Cột hiển thị" onClose={()=>setColumnOpen(false)} footer={<><Button motion="standard" variant="text" onClick={()=>{setHidePic(false);setExtra(columns.filter(c=>!['identity','board','payment'].includes(c.key)).map(c=>c.key));}}>Chọn tất cả</Button><Button motion="standard" variant="text" onClick={()=>{setExtra([]);setHidePic(false);}}>Mặc định</Button><Button motion="standard" onClick={()=>setColumnOpen(false)}>Xong</Button></>}><p className="ct-note">Họ tên, bảng thi và thanh toán luôn hiển thị. Các cột bổ sung có thể cuộn ngang.</p>{columns.filter(c=>!['identity','board','payment'].includes(c.key)).map(c=><Checkbox key={c.key} checked={c.key==='pic'?!hidePic&&(layout==='expanded'||extra.includes('pic')):extra.includes(c.key)} onChange={checked=>{if(c.key==='pic')setHidePic(!checked);setExtra(old=>checked?[...old.filter(x=>x!==c.key),c.key]:old.filter(x=>x!==c.key));}}>{c.label}</Checkbox>)}</Dialog>}
    {row&&<ContactDetail row={row} canViewPii={canViewPii} onClose={()=>setDetail(null)}/>}
  </section>;
}
