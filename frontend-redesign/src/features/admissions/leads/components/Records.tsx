import { LoadingState } from "@/shared/LoadingState";
import { RecordTable, RecordList, WorkspacePagination, type RecordColumn } from '@/shared/DataWorkspace';
import { WorkspaceSelect } from '@/shared/WorkspaceSelect';
import { IconButton } from '@/components/expressive/icon-button';
import { Checkbox } from '@/components/expressive/checkbox';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {ChevronRight,Columns3,Search} from 'lucide-react';
import {Button} from '@/components/expressive/button';
import {TextField} from '@/components/expressive/text-field';
import {dateText,numberText} from '@/shared/format';
import type {useResource} from '@/services/useResource';
import {layoutForWidth,textValue,canExport,type LeadList,type LeadRow} from '../model';
import {pageCount,sortFields,validSort} from '../query';
import {LeadDetail,Result} from './LeadDetail';
import {Dialog} from './Dialog';
import {ExportCsv} from './ExportCsv';
export type ListControls={page:number;size:number;sort:string};
const required=['identity','source','result','created_at'];
const columns:RecordColumn<LeadRow>[]=[
 {key:'identity',label:'Họ tên / Mã',sort:'full_name',render:r=><div className="ld-identity"><strong>{r.full_name||'Chưa có họ tên'}</strong><small>{textValue(r.contact_id)}</small></div>},
 {key:'source',label:'Nguồn',sort:'source',render:r=>textValue(r.source)},
 {key:'result',align:'center',label:'Đối soát',sort:'result',render:r=><Result value={r.result}/>},
 {key:'created_at',align:'center',label:'Ngày gửi',sort:'created_at',render:r=>r.created_at?dateText(r.created_at):'—'},
 {key:'pic',label:'Phụ trách',render:r=>textValue(r.pic)},
 {key:'board',align:'center',label:'Bảng quan tâm',render:r=>textValue(r.board_interest)},
 {key:'region',label:'Miền',render:r=>textValue(r.region)},
 {key:'province',label:'Tỉnh/thành',render:r=>textValue(r.province)},
 {key:'segment',label:'Nhóm CRM',sort:'segment',render:r=>textValue(r.segment)},
 {key:'campaign',label:'Chiến dịch',sort:'campaign',render:r=>textValue(r.campaign)},
 {key:'platform',label:'Nền tảng',render:r=>textValue(r.platform)},
 {key:'heard_from',label:'Biết Talkshow qua',render:r=>textValue(r.heard_from)},
 {key:'email',label:'Email',render:r=>textValue(r.email)},
 {key:'phone',label:'Điện thoại',render:r=>textValue(r.phone)},
 {key:'question',label:'Câu hỏi',render:r=>textValue(r.question)},
];
function RowAction({row,onClick}:{row:LeadRow;onClick:()=>void}) {return <IconButton className="dw-row-action" variant="standard" motion="standard" aria-label={`Xem chi tiết ${row.full_name||row.contact_id||'không có mã'} (${textValue(row.source)}, dòng ${textValue(row.row_no)})`} onClick={onClick}><ChevronRight aria-hidden="true"/></IconButton>;}
export function Records({path,csvPath,controls,onControls,search,onSearch,pending,canViewPii,filterOpen,resource,onReset,hasFilters}:{path:string|null;csvPath:string;controls:ListControls;onControls:(c:ListControls)=>void;search:string;onSearch:(s:string)=>void;pending:boolean;canViewPii:boolean;filterOpen:boolean;resource:ReturnType<typeof useResource<LeadList>>;onReset:()=>void;hasFilters:boolean}) {
  const {page,size,sort}=controls;
  const data=resource.state==='ready'?resource.data:null;const pages=data?pageCount(data.total,size):1;
  const [detail,setDetail]=useState<{path:string;data:LeadList;row:LeadRow}|null>(null);
  const row=detail&&detail.path===path&&detail.data===data?detail.row:undefined;
  const [columnOpen,setColumnOpen]=useState(false);const [extra,setExtra]=useState<string[]>([]);
  const container=useRef<HTMLElement>(null);const [layout,setLayout]=useState<'compact'|'medium'|'expanded'>('compact');
  useLayoutEffect(()=>{const el=container.current;if(!el)return;const measure=()=>setLayout(layoutForWidth(el.clientWidth));measure();const observer=new ResizeObserver(measure);observer.observe(el);return()=>observer.disconnect();},[]);
  useEffect(()=>{if(layout==='compact')setColumnOpen(false);},[layout]);
  useEffect(()=>{if(data&&page>pages)onControls({...controls,page:pages});},[data,page,pages]);
  useLayoutEffect(()=>{setDetail(null);},[path,data]);
  const availableColumns=columns.filter(c=>c.key!=="question"||canViewPii);
  const activeCols=availableColumns.filter(c=>required.includes(c.key)||extra.includes(c.key));
  const setSort=(s:string)=>onControls({...controls,sort:validSort(s),page:1});
  const disabled=!data||!data.total||pending||resource.refreshing||!!resource.refreshError||filterOpen||!path||page>pages;
  const rowIdentity=(r:LeadRow)=>JSON.stringify([r.source,r.row_no]);
  const identities=new Map<string,number>();
  for(const r of data?.rows??[]){const key=rowIdentity(r);identities.set(key,(identities.get(key)??0)+1);}
  const rowKey=(r:LeadRow,i:number)=>{const key=rowIdentity(r);return r.source&&r.row_no!=null&&identities.get(key)===1?key:JSON.stringify([key,r.contact_id,i]);};
  const action=(r:LeadRow)=>path&&data&&<RowAction row={r} onClick={()=>setDetail({path,data,row:r})}/>;
  return <section className="ld-panel ld-records" ref={container} aria-label="Danh sách lead">
    <div className="ld-panel-head"><h2>Danh sách lead</h2><span className="ld-count" role="status">{data?`${numberText(data.total)} dòng phù hợp`:resource.state==='error'?'Chưa tải được số dòng':path?'Đang xác định số dòng':'Chưa có kết quả'}</span></div>
    <div className="dw-record-toolbar"><TextField className="dw-search" label={canViewPii?"Tìm mã, họ tên, email":"Tìm mã, họ tên"} variant="search" leadingIcon={<Search aria-hidden="true"/>} value={search} maxLength={80} onChange={e=>onSearch(e.target.value)}/><WorkspaceSelect label="Sắp xếp" value={sort} options={sortFields.flatMap(([key,label])=>[{value:key,label:`${label} ↑`},{value:`-${key}`,label:`${label} ↓`}])} onChange={setSort}/><div className="dw-tool-actions">{layout!=='compact'&&<Button motion="standard" variant="outlined" icon={<Columns3/>} onClick={()=>setColumnOpen(true)}>Cột</Button>}{canExport(canViewPii)?<ExportCsv key={csvPath} path={csvPath} disabled={disabled}/>:<p className="ld-note">Xuất CSV chưa khả dụng với quyền xem dữ liệu giới hạn.</p>}</div></div>
    <p className="ld-note">Tìm kiếm chỉ áp dụng cho danh sách và CSV.</p>
    {resource.refreshing&&<p role="status" className="ld-note">Đang cập nhật lead…</p>}{pending&&<p role="status" className="ld-note">Đang cập nhật tìm kiếm…</p>}
    {resource.refreshError&&<p role="alert" className="ld-error">{resource.refreshError} · Đang hiển thị dữ liệu lần tải trước.</p>}
    {!path?<div className="ld-state">Hãy kiểm tra bộ lọc hoặc phạm vi dữ liệu.</div>:resource.state==='error'?<div className="ld-state"><p role="alert">{resource.message}</p><Button motion="standard" variant="tonal" onClick={resource.retry}>Thử lại</Button></div>:!data||page>pages?<LoadingState label="Đang tải lead…"/>:data.rows.length===0?<div className="ld-state"><h3>{hasFilters||search?"Không tìm thấy lead phù hợp":"Không có lead trong phạm vi này"}</h3>{(hasFilters||search)&&<><p className="ld-note">Thử thay đổi tìm kiếm hoặc bộ lọc.</p><Button motion="standard" variant="tonal" onClick={onReset}>Xóa lọc và tìm kiếm</Button></>}</div>:layout==='compact'?<RecordList rows={data.rows} rowKey={rowKey} render={r=><><strong>{r.full_name||'Chưa có họ tên'}</strong><small>{textValue(r.contact_id)} · {textValue(r.source)}</small><Result value={r.result}/><small>{r.created_at?dateText(r.created_at):'Chưa có ngày gửi'}{r.pic?` · ${r.pic}`:''}</small></>} action={action}/>:<RecordTable rows={data.rows} columns={activeCols} rowKey={rowKey} sort={sort} onSort={setSort} action={action} label="Bảng lead, có thể cuộn ngang" className={extra.length?'ld-extra':''}/>}
    {data&&data.total>0&&page<=pages&&<WorkspacePagination page={page} pages={pages} size={size} total={data.total} unit="dòng" pending={pending} onPage={page=>onControls({...controls,page})} onSize={size=>onControls({...controls,size,page:1})}/>}
    {canViewPii&&<p className="ld-note">CSV gồm tất cả dòng phù hợp, theo ngày gửi tăng dần; không chỉ trang hiện tại.</p>}
    {columnOpen&&layout!=='compact'&&<Dialog title="Cột hiển thị" onClose={()=>setColumnOpen(false)} footer={<><Button motion="standard" variant="text" onClick={()=>setExtra(availableColumns.filter(c=>!required.includes(c.key)).map(c=>c.key))}>Chọn tất cả</Button><Button motion="standard" variant="text" onClick={()=>setExtra([])}>Mặc định</Button><Button motion="standard" onClick={()=>setColumnOpen(false)}>Xong</Button></>}><p className="ld-note">Họ tên, nguồn, kết quả và ngày gửi luôn hiển thị. Các cột bổ sung có thể cuộn ngang.</p>{availableColumns.filter(c=>!required.includes(c.key)).map(c=><Checkbox key={c.key} checked={extra.includes(c.key)} onChange={checked=>{setExtra(old=>checked?[...old.filter(x=>x!==c.key),c.key]:old.filter(x=>x!==c.key));}}>{c.label}</Checkbox>)}</Dialog>}
    {row&&<LeadDetail row={row} canViewPii={canViewPii} onClose={()=>setDetail(null)}/>}
  </section>;
}
