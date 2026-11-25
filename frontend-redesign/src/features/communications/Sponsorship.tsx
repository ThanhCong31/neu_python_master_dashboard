import './communications.css';
import {lazy,Suspense} from 'react';
import {Button} from '@/components/expressive/button';
import {LoadingState} from '@/shared/LoadingState';
import {PageRefresh} from '@/shared/PageActions';
import {useWorkspace} from '@/app/workspace';
import {useResource} from '@/services/useResource';
import type {Summary} from './sponsorship/model';
import {sponsorshipPath} from './sponsorship/query';
const Analytics=lazy(()=>import('./sponsorship/components/Analytics'));
function Workbench({partner}:{partner:string|null}) {
  const resource=useResource<Summary>(sponsorshipPath(partner));
  return <div className="com-page"><PageRefresh busy={resource.state==='loading'||resource.refreshing} onRefresh={resource.retry}/><p className="com-intro">Theo dõi quyền lợi cam kết với nhà tài trợ và hiệu quả các kênh truyền thông của chương trình.</p><Suspense fallback={<LoadingState label="Đang tải phân tích…"/>}><Analytics resource={resource}/></Suspense></div>;
}
export default function Sponsorship() {
  const {user,partner,scopeStatus,retryScope}=useWorkspace();
  if(scopeStatus==='error')return <div className="com-panel com-state"><p role="alert">Không xác nhận được phạm vi dữ liệu.</p><Button motion="standard" variant="tonal" onClick={retryScope}>Thử lại</Button></div>;
  if(scopeStatus!=='ready')return <LoadingState label="Đang xác nhận phạm vi dữ liệu…"/>;
  const effectivePartner=user.role==='admin'?partner:user.partner_code;
  return <Workbench key={JSON.stringify([user.username,user.role,effectivePartner,user.can_view_pii])} partner={user.role==='admin'?partner:null}/>;
}
