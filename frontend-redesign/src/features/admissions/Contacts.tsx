import { LoadingState } from "@/shared/LoadingState";
import {lazy,Suspense,useEffect,useLayoutEffect,useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {PageRefresh} from '@/shared/PageActions';
import {Button} from '@/components/expressive/button';
import {ViewSwitch} from '@/components/expressive/view-switch';
import {useWorkspace} from '@/app/workspace';
import {useResource} from '@/services/useResource';
import type {Filters,OptionsResponse,ContactList,Summary} from './contacts/model';
import {filterError,makePath,parseFilters,searchValue,writeFilters} from './contacts/query';
import {FilterBar,FilterDialog} from './contacts/components/Filters';
import {Records,type ListControls} from './contacts/components/Records';
import './contacts/contacts.css';
const Analytics=lazy(()=>import('./contacts/components/Analytics'));
function Workbench({partner,effectivePartner,canViewPii,scopeReset}:{partner:string|null;effectivePartner:string|null;canViewPii:boolean;scopeReset:boolean}){
  const [params,setParams]=useSearchParams();const filters=parseFilters(params);const mode=params.get('view')==='analysis'?'analysis':'records';
  const [draftOpen,setDraftOpen]=useState(false);const [search,setSearch]=useState('');const [q,setQ]=useState('');
  const [pageState,setPageState]=useState<{key:string;controls:ListControls}>({key:'',controls:{page:1,size:20,sort:'contact_id'}});
  const filterKey=makePath('summary',partner,filters);const queryKey=filterKey+'\n'+q;
  const controls=pageState.key===queryKey?pageState.controls:{...pageState.controls,page:1};
  const onControls=(c:ListControls)=>setPageState({key:queryKey,controls:c});
  useLayoutEffect(()=>{if(pageState.key!==queryKey)setPageState(s=>({key:queryKey,controls:{...s.controls,page:1}}));},[queryKey,pageState.key]);
  useEffect(()=>{const value=searchValue(search);if(value===q)return;const timer=setTimeout(()=>{setQ(value);setPageState(s=>({...s,key:'',controls:{...s.controls,page:1}}));},300);return()=>clearTimeout(timer);},[search,q]);
  const options=useResource<OptionsResponse>(makePath('options',partner));
  const opts=options.state==='ready'&&options.data.viewing_partner===effectivePartner?options.data.contacts:undefined;
  const error=filterError(filters,opts);const optionsError=options.state==='ready'&&!opts?'Không có danh mục tuyển sinh đúng phạm vi.':null;
  const ready=!!opts&&!error;const listPath=ready?makePath('list',partner,filters,q,controls.page,controls.size,controls.sort):null;
  const records=useResource<ContactList>(mode==='records'?listPath:null,{clearWhenDisabled:true});
  const analysis=useResource<Summary>(mode==='analysis'&&ready?filterKey:null,{clearWhenDisabled:true});
  const active=mode==='records'?records:analysis;
  const busy=options.state==='loading'||options.refreshing||(ready&&(active.state==='loading'||active.refreshing));
  function changeFilters(next:Filters){setParams(prev=>writeFilters(prev,next));setPageState(s=>({...s,key:'',controls:{...s.controls,page:1}}));setDraftOpen(false);}
  function changeMode(next:'records'|'analysis'){setDraftOpen(false);setParams(prev=>{const p=new URLSearchParams(prev);if(next==='analysis')p.set('view','analysis');else p.delete('view');return p;});}
  function reset(){setSearch('');setQ('');changeFilters({});}
  return <div className="ct-page"><PageRefresh busy={busy} disabled={draftOpen} onRefresh={()=>{options.retry();if(ready)active.retry();}}/><div className="ct-top"><ViewSwitch label="Chế độ tuyển sinh" value={mode} options={[{value:'records',label:'Hồ sơ liên hệ'},{value:'analysis',label:'Phân tích tuyển sinh'}]} onChange={changeMode}/></div>
    <FilterBar filters={filters} options={opts} onChange={changeFilters} onOpen={()=>setDraftOpen(true)}/>{scopeReset&&<p className="ct-note" role="status">Bộ lọc và tìm kiếm đã được đặt lại theo phạm vi đối tác mới.</p>}
    {options.state==='error'&&<div className="ct-error" role="alert">{options.message} <Button variant="text" onClick={options.retry}>Thử lại</Button></div>}{options.state==='loading'&&<p className="ct-note" role="status">Đang tải danh mục bộ lọc…</p>}{options.refreshError&&<p className="ct-error" role="alert">{options.refreshError}</p>}{optionsError&&<p className="ct-error" role="alert">{optionsError}</p>}{error&&<p className="ct-error" role="alert">{error}</p>}
    {mode==='records'?<Records resource={records} path={listPath} csvPath={makePath('csv',partner,filters,q)} controls={controls} onControls={onControls} search={search} onSearch={setSearch} pending={searchValue(search)!==q} canViewPii={canViewPii} filterOpen={draftOpen} onReset={reset} hasFilters={Object.values(filters).some(Boolean)}/>:<Suspense fallback={<LoadingState className="ct-panel" label="Đang tải phân tích…"/>}><Analytics resource={analysis} path={ready?filterKey:null} hasSearch={!!searchValue(search)} onGroup={(key,value)=>{const next={...filters,[key]:value};if(filterError(next,opts))return;setParams(prev=>{const p=writeFilters(prev,next);p.delete('view');return p;});setSearch('');setQ('');setPageState(s=>({...s,key:'',controls:{...s.controls,page:1}}));}} options={opts}/></Suspense>}
    {draftOpen&&opts&&<FilterDialog filters={filters} options={opts} onApply={changeFilters} onClose={()=>setDraftOpen(false)}/>}
  </div>;
}
export default function Contacts(){
  const {user,partner,scopeStatus,retryScope}=useWorkspace();const [params,setParams]=useSearchParams();const effectivePartner=user.role==='admin'?partner:user.partner_code;
  const identity=JSON.stringify([user.username,user.role,effectivePartner,user.can_view_pii]);const [boundary,setBoundary]=useState(identity);const [reset,setReset]=useState(false);
  useLayoutEffect(()=>{if(boundary!==identity){if(Object.keys(parseFilters(params)).length){setParams(prev=>writeFilters(prev,{}),{replace:true});return;}setBoundary(identity);setReset(true);}},[identity,boundary,params,setParams]);
  if(scopeStatus==='error')return <div className="ct-panel ct-state"><p role="alert">Không xác nhận được phạm vi dữ liệu.</p><Button onClick={retryScope}>Thử lại</Button></div>;
  if(scopeStatus!=='ready'||identity!==boundary)return <LoadingState className="ct-panel" label="Đang xác nhận phạm vi dữ liệu…"/>;
  return <Workbench key={identity} partner={user.role==='admin'?partner:null} effectivePartner={effectivePartner} canViewPii={user.can_view_pii} scopeReset={reset}/>;
}
