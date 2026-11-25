import './communications.css';
import {lazy,Suspense,useState} from 'react';
import {Button} from '@/components/expressive/button';
import {LoadingState} from '@/shared/LoadingState';
import {PageRefresh} from '@/shared/PageActions';
import {useWorkspace} from '@/app/workspace';
import {useResource} from '@/services/useResource';
import type {Filters,OptionsResponse,Summary} from './marketing/model';
import {filterError,marketingPath,scopedOptions} from './marketing/query';
import {FilterBar,FilterDialog} from './marketing/components/Filters';
const Analytics=lazy(()=>import('./marketing/components/Analytics'));

function Workbench({partner,effectivePartner}:{partner:string|null;effectivePartner:string|null}) {
  const [filters,setFilters]=useState<Filters>({});
  const [filterOpen,setFilterOpen]=useState(false);
  const metadata=useResource<OptionsResponse>(marketingPath('options',partner));
  const options=metadata.state==='ready'?scopedOptions(metadata.data,effectivePartner):undefined;
  const error=filterError(filters,options);
  // Unfiltered data does not depend on option discovery. Never submit invalid filters.
  const ready=!error&&(Object.keys(filters).length===0||!!options);
  const resource=useResource<Summary>(ready?marketingPath('summary',partner,filters):null,{clearWhenDisabled:true});
  const busy=metadata.state==='loading'||metadata.refreshing||(ready&&(resource.state==='loading'||resource.refreshing));
  return <div className="com-page">
    <PageRefresh busy={busy} disabled={filterOpen&&!!options} onRefresh={()=>{metadata.retry();if(ready)resource.retry();}}/>
    <p className="com-intro">Hiệu quả các kênh truyền thông trong phạm vi đang xem. Số liệu thu về tính từ hồ sơ liên hệ (CRM).</p>
    <FilterBar filters={filters} options={options} onOpen={()=>setFilterOpen(true)} onReset={()=>setFilters({})}/>
    {metadata.state==='error'&&<p className="dw-error" role="alert">{metadata.message} <Button motion="standard" variant="text" onClick={metadata.retry}>Thử lại</Button></p>}
    {metadata.state==='ready'&&!options&&<p className="dw-error" role="alert">Không xác nhận được danh mục bộ lọc trong phạm vi hiện tại.</p>}
    {metadata.refreshError&&<p className="dw-error" role="alert">{metadata.refreshError}</p>}
    {error&&<p className="dw-error" role="alert">{error} Hãy sửa hoặc xóa bộ lọc.</p>}
    {!ready?<p className="dw-note">Hãy kiểm tra bộ lọc hoặc phạm vi dữ liệu.</p>:<Suspense fallback={<LoadingState label="Đang tải phân tích…"/>}><Analytics resource={resource}/></Suspense>}
    {filterOpen&&options&&<FilterDialog filters={filters} options={options} onClose={()=>setFilterOpen(false)} onApply={next=>{setFilters(next);setFilterOpen(false);}}/>}
  </div>;
}
export default function Marketing() {
  const {user,partner,scopeStatus,retryScope}=useWorkspace();
  if(scopeStatus==='error')return <div className="com-panel com-state"><p role="alert">Không xác nhận được phạm vi dữ liệu.</p><Button motion="standard" variant="tonal" onClick={retryScope}>Thử lại</Button></div>;
  if(scopeStatus!=='ready')return <LoadingState label="Đang xác nhận phạm vi dữ liệu…"/>;
  const effectivePartner=user.role==='admin'?partner:user.partner_code;
  return <Workbench key={JSON.stringify([user.username,user.role,effectivePartner,user.can_view_pii])} partner={user.role==='admin'?partner:null} effectivePartner={effectivePartner}/>;
}
