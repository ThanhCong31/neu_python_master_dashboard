import './overview.css';
import { useWorkspace } from '@/app/workspace';
import { useResource } from '@/services/useResource';
import { Button } from '@/components/expressive/button';
import { RefreshCw } from 'lucide-react';
import { overviewPath, visibleDomains, type OverviewData } from './model';
import { ExportActions } from './components/ExportActions';
import { AdmissionsMetrics } from './components/Metrics';
import { Funnel, FollowUp, Timeline, Grades, DetailLink } from './components/Analysis';
import { DomainSummary, type Links } from './components/Domains';
export default function Overview() {
  const w=useWorkspace();
  const invalid=w.user.role==='admin' && !!w.partner && !w.partners.some(p=>p.code===w.partner);
  const ready=w.scopeStatus==='ready'&&!invalid;
  const expected=w.user.role==='admin'?w.partner:w.user.partner_code;
  const resource=useResource<OverviewData>(ready?overviewPath(w.partner):null);
  const data=ready&&resource.state==='ready'&&resource.data.viewing_partner===expected?resource.data:null;
  const groups=data?visibleDomains(data,w.user.modules):[];
  const primary=groups[0]; const secondary=groups.slice(1);
  const pathFor=(module:string)=>data?.modules.includes(module)?w.destinations.find(d=>d.id===module)?.path:undefined;
  const links:Links={crm:pathFor('contacts'),exams:pathFor('exams'),marketing:pathFor('marketing'),sponsorship:pathFor('sponsorship'),quality:pathFor('quality')};
  const scopeName=w.user.role==='admin'?(!ready?'Đang xác thực phạm vi…':w.partners.find(p=>p.code===w.partner)?.name??'Toàn hệ thống'):(w.user.partner_name??w.user.partner_code??'Đối tác');
  const mismatch=ready&&resource.state==='ready'&&!data;
  return <div className="ov-page">
    <div className="ov-toolbar"><div className="ov-context"><p className="text-title-medium">{scopeName}</p><p className="ov-note">Toàn bộ dữ liệu trong phạm vi đang xem.</p></div><div className="ov-tools"><Button variant="text" size="sm" aria-label="Cập nhật Tổng quan" icon={<RefreshCw aria-hidden="true"/>} disabled={!data||resource.refreshing} onClick={resource.retry}>{resource.refreshing?'Đang cập nhật…':'Cập nhật'}</Button><ExportActions key={expected??'all'} partner={w.partner} disabled={!data||!groups.length||resource.refreshing}/></div></div>
    {w.scopeStatus==='error'?<section className="ov-panel ov-state" role="alert"><h2>Không tải được phạm vi dữ liệu</h2><Button onClick={w.retryScope}>Thử lại</Button></section>:resource.state==='error'?<section className="ov-panel ov-state" role="alert"><h2>Không tải được Tổng quan</h2><p>{resource.message}</p><Button onClick={resource.retry}>Thử lại</Button></section>:mismatch?<section className="ov-panel ov-state" role="alert"><h2>Phạm vi dữ liệu không khớp</h2><p>Không hiển thị số liệu để tránh nhầm lẫn giữa các đối tác.</p><Button onClick={resource.retry}>Thử lại</Button></section>:!data?<div className="ov-skeleton" role="status" aria-label="Đang tải Tổng quan"><span>Đang tải Tổng quan…</span></div>:<div key={expected??"all"} className="ov-sections" aria-busy={resource.refreshing}>
      {resource.refreshError&&<p className="ov-error" role="alert">{resource.refreshError} Đang hiển thị dữ liệu lần tải trước.</p>}
      {primary==='crm'&&data.crm&&<><AdmissionsMetrics k={data.crm.kpi}/><div className="ov-analysis"><Funnel k={data.crm.kpi}/><FollowUp k={data.crm.kpi} to={links.crm}/></div><Timeline timeline={data.crm.timeline} k={data.crm.kpi}/></>}
      {primary&&primary!=='crm'&&<DomainSummary domain={primary} data={data} links={links} primary/>}
      {primary==='exams'&&data.exams&&<Grades grades={data.exams.grades}/>}
      {secondary.length>0&&<section className="ov-other"><h2>Các lĩnh vực khác</h2><div className="ov-domain-grid">{secondary.map(group=>group==='crm'?null:<DomainSummary key={group} domain={group} data={data} links={links}/>)}</div></section>}
      {!groups.length&&<section className="ov-panel"><h2>Chưa có lĩnh vực tổng quan</h2><p className="ov-note">Sử dụng điều hướng để mở các chức năng được cấp quyền.</p></section>}
      {links.quality&&data.pipeline&&w.user.role==='admin'&&!expected&&<div className="ov-quality"><p className="ov-note">Kiểm tra đối soát và lịch sử nhập dữ liệu.</p><DetailLink to={links.quality}>Chất lượng dữ liệu</DetailLink></div>}
      {groups.length>0&&<p className="ov-note ov-export-note">Báo cáo tổng quan xuất từ máy chủ, bao gồm các bảng nghiệp vụ được cấp quyền, không chỉ nội dung trên màn hình. Một số dữ liệu là giả lập hoặc phân bổ giả định; xem chú thích từng lĩnh vực.</p>}
    </div>}
  </div>;
}
