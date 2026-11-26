import { useLayoutEffect, useRef, useState } from 'react';
import { Download, ChevronDown, FileSpreadsheet, FileText, File } from 'lucide-react';
import { Button } from '@/components/expressive/button';
import { Menu, MenuTrigger, MenuContent, MenuItem } from '@/components/expressive/menu';
import { api, apiFile } from '@/services/api';
import { reportPath, reportMimeValid } from '../model';
import { useWorkspace } from '@/app/workspace';
import { useResource } from '@/services/useResource';
import { ResponsiveDialog } from '@/shared/ResponsiveDialog';
import { TextField } from '@/components/expressive/text-field';
import { SystemSelect } from '@/features/system/components/SystemSelect';
import { dateText, numberText } from '@/shared/format';
import { formatDate } from '@/features/system/components/Elements';
import type { PartnersResult } from '@/features/system/types';
const formats = [
  {id:'xlsx',label:'Excel',description:'Phân tích dữ liệu',Icon:FileSpreadsheet},
  {id:'docx',label:'Word',description:'Báo cáo có thể chỉnh sửa',Icon:FileText},
  {id:'pdf',label:'PDF',description:'Chia sẻ và in ấn',Icon:File},
] as const;
type Format = typeof formats[number]['id'];
const periods = [
  {id:'month', label:'Báo cáo theo tháng', description:'Chọn tháng và năm'},
  {id:'quarter', label:'Báo cáo theo quý', description:'Chọn quý và năm'},
  {id:'stage', label:'Báo cáo theo giai đoạn', description:'Chọn mốc trong lịch chương trình'},
  {id:'overview', label:'Tổng quan hiện tại', description:'Xuất trực tiếp số liệu tổng quan'},
] as const;
type Period = typeof periods[number]['id'];
export function ExportActions({ partner, disabled }: { partner: string | null; disabled: boolean }) {
  const [busy,setBusy] = useState<Format | null>(null);
  const [period, setPeriod] = useState<Period | null>(null);
  const { user } = useWorkspace();
  const [message,setMessage] = useState('');
  const [failed,setFailed] = useState(false);
  const active = useRef<AbortController | null>(null);
  useLayoutEffect(()=>{
    setBusy(null); setMessage('');
    return ()=>{ active.current?.abort(); active.current=null; };
  },[partner,disabled]);
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
  if (user.can_export_reports === false && user.role !== "admin") return null;
  return <div className="ov-export">
    <Menu>
      <MenuTrigger disabled={disabled||busy!==null} render={<Button variant="tonal" motion="standard" className="min-h-12" disabled={disabled||busy!==null} icon={<Download aria-hidden="true"/>}/>}>
        {busy?'Đang xuất…':'Xuất báo cáo'} <ChevronDown aria-hidden="true"/>
      </MenuTrigger>
      <MenuContent align="end" sideOffset={8} className="ov-export-menu">
        {periods.map(item => <MenuItem key={item.id} supportingText={item.description} onClick={() => {
          setMessage('');
          setPeriod(item.id);
        }}>{item.label}</MenuItem>)}
      </MenuContent>
    </Menu>
    {period === 'overview' && <ResponsiveDialog title="Tổng quan hiện tại" dismissible={busy === null}
      onClose={() => setPeriod(null)}
      footer={<Button variant="text" disabled={busy !== null} onClick={() => setPeriod(null)}>Đóng</Button>}>
      <p className="ov-note">Tải số liệu tổng quan theo phạm vi đang xem.</p>
      <DownloadFormats disabled={disabled || busy !== null} onDownload={format => void download(format)}/>
      {busy && <p role="status" className="ov-note">Đang xuất {formats.find(f => f.id === busy)?.label}…</p>}
      {message && <p role={failed ? 'alert' : 'status'} className={failed ? 'ov-error' : 'ov-note'}>{message}</p>}
    </ResponsiveDialog>}
    {period && period !== 'overview' && <MonthlyReportDialog key={`${period}:${partner ?? user.partner_code ?? "all"}`}
      kind={period} initialPartner={partner} onClose={() => setPeriod(null)}/>}
  </div>;
}


function DownloadFormats({ disabled, onDownload }: {disabled: boolean; onDownload: (format: Format) => void}) {
  return <div className="ov-tools">
    {formats.map(({id, label, Icon}) => <Button key={id} variant="outlined" disabled={disabled}
      icon={<Icon aria-hidden="true"/>} onClick={() => onDownload(id)}>{label}</Button>)}
  </div>;
}

type ReportStage = {id: string; label: string; schedule: string};
type MonthlyPreview = {partner: string; preview_id: string; sections: [string, (number | string)[][]][]};
type MonthlyReport = {_id: string; partner: string; month?: string; period_key?: string; generated_at: string};

function MonthlyReportDialog({ kind, initialPartner, onClose }: {kind: Exclude<Period, 'overview'>; initialPartner: string | null; onClose: () => void}) {
  const { user, partners } = useWorkspace();
  const admin = user.role === 'admin';
  const [partner, setPartner] = useState(initialPartner ?? '');
  const partnerOptions = useResource<PartnersResult>(admin ? '/admin/partners' : null);
  const partnerChoices = partnerOptions.state === 'ready' ? partnerOptions.data.partners : partners;
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [quarter, setQuarter] = useState('');
  const [stage, setStage] = useState('');
  const stageResource = useResource<{stages: ReportStage[]}>(kind === 'stage' ? '/overview/monthly/stages' : null);
  const stages = stageResource.state === 'ready' ? stageResource.data.stages : [];
  const selectedStage = stages.find(item => item.id === stage);
  const [previewQuery, setPreviewQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [closed, setClosed] = useState<MonthlyReport | null>(null);
  const savedHeading = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    if (closed) savedHeading.current?.focus();
  }, [closed]);
  const validPeriod = kind === 'month'
    ? /^(?!0000|9999)[0-9]{4}-(0[1-9]|1[0-2])$/.test(month)
    : kind === 'quarter'
      ? /^[0-9]{4}$/.test(year) && +year > 0 && +year < 9999 && /^[1-4]$/.test(quarter)
      : !!selectedStage;
  const selection = kind === 'month' ? {month}
    : kind === 'quarter' ? {year, quarter} : {stage};
  const query = new URLSearchParams({kind});
  for (const [key, value] of Object.entries(selection)) query.set(key, value);
  if (admin && partner) query.set('partner', partner);
  const canLoad = validPeriod && (!admin || !!partner);
  const canPreview = canLoad && (!admin || partnerChoices.some(item => item.code === partner && (!('active' in item) || item.active)));
  const preview = useResource<MonthlyPreview>(previewQuery ? `/overview/monthly/preview?${previewQuery}` : null);
  const history = useResource<{reports: MonthlyReport[]}>(canLoad ? `/overview/monthly?${query}` : null);

  function clearSelection() {
    setPreviewQuery('');
    setClosed(null);
    setError('');
  }

  async function closeReport() {
    if (busy || preview.state !== 'ready' || preview.refreshing || preview.refreshError) return;
    setBusy(true);
    setError('');
    try {
      const saved = await api<MonthlyReport>('/overview/monthly', {method: 'POST', json: {
        kind, ...selection, partner: admin ? partner : null, preview_id: preview.data.preview_id,
      }});
      setClosed(saved);
      history.retry();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể chốt báo cáo.');
    } finally {
      setBusy(false);
    }
  }

  async function download(report: MonthlyReport, format: Format) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const params = new URLSearchParams({format});
      if (admin) params.set('partner', report.partner);
      const blob = await apiFile(`/overview/monthly/${encodeURIComponent(report._id)}/download?${params}`);
      if (!blob.size || !reportMimeValid(format, blob.type)) throw new Error('Tệp báo cáo không hợp lệ.');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bao-cao-${report.partner}-${report.period_key ?? report.month}-${report._id.slice(0, 10)}.${format}`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể tải báo cáo.');
    } finally {
      setBusy(false);
    }
  }

  const reports = history.state === 'ready' ? history.data.reports : [];
  const previousReports = reports.filter(report => report._id !== closed?._id);
  return <ResponsiveDialog className="ov-report-dialog" title={periods.find(item => item.id === kind)!.label} onClose={() => { if (!busy) onClose(); }} dismissible={!busy}
    footer={<Button variant="text" onClick={onClose} disabled={busy}>Đóng</Button>}>
    <div className="ov-report-content" aria-busy={busy}>
      {admin ? <SystemSelect native label="Đối tác" value={partner} disabled={busy}
        options={[{value: '', label: 'Chọn đối tác'}, ...partnerChoices.map(item => ({value: item.code, label: `${item.name}${'active' in item && !item.active ? ' · Đã khóa' : ''}`}))]}
        onChange={code => { setPartner(code); clearSelection(); }}/>
        : <p className="ov-note">Đối tác {user.partner_name ?? user.partner_code}</p>}
      {kind === 'month' && <TextField label="Tháng báo cáo" labelPlacement="above" type="month" value={month} disabled={busy}
        min="0001-01" max="9998-12" onChange={e => { setMonth(e.target.value); clearSelection(); }}/>}
      {kind === 'quarter' && <div className="ov-report-period">
        <SystemSelect native label="Quý" value={quarter} disabled={busy}
          options={[{value:'', label:'Chọn quý'}, ...[1, 2, 3, 4].map(q => ({value:String(q), label:`Quý ${q}`}))]}
          onChange={value => { setQuarter(value); clearSelection(); }}/>
        <label className="sys-field">
          <span>Năm</span>
          <input className="sys-input" inputMode="numeric" maxLength={4} placeholder="Ví dụ 2026" value={year} disabled={busy}
            onChange={e => { setYear(e.target.value); clearSelection(); }}/>
        </label>
      </div>}
      {kind === 'stage' && <div className="ov-report-stage">
        <SystemSelect native label="Mốc chương trình" value={stage} disabled={busy || stageResource.state !== 'ready'}
          options={[{value:'', label:stageResource.state === 'loading' ? 'Đang tải lịch chương trình…' : 'Chọn mốc chương trình'},
            ...stages.map(item => ({value:item.id, label:item.label}))]}
          onChange={value => { setStage(value); clearSelection(); }}/>
        {selectedStage && <p className="ov-note">Lịch chương trình · {selectedStage.schedule}</p>}
        {stageResource.state === 'error' && <p className="ov-error" role="alert">{stageResource.message}
          <Button size="xs" variant="text" onClick={stageResource.retry}>Thử lại</Button>
        </p>}
      </div>}
      <div className="ov-tools">
        <Button variant="outlined" disabled={!canPreview || busy || !!previewQuery && preview.state === 'loading'} onClick={() => {
          setClosed(null);
          setError('');
          if (previewQuery === query.toString()) preview.retry();
          else setPreviewQuery(query.toString());
        }}>Xem trước</Button>
        {previewQuery && preview.state === 'ready' && <Button disabled={busy || !!closed || preview.refreshing || !!preview.refreshError}
          onClick={() => void closeReport()}>{busy ? 'Đang xử lý…' : 'Chốt báo cáo'}</Button>}
      </div>
      {error && <p className="ov-error" role="alert">{error}</p>}
      {closed && <section className="ov-panel ov-report-saved">
        <h2 ref={savedHeading} tabIndex={-1}>Đã chốt báo cáo</h2>
        <p className="ov-note">Lưu lúc {formatDate(closed.generated_at)}. Chọn định dạng để tải.</p>
        <DownloadFormats disabled={busy} onDownload={format => void download(closed, format)}/>
      </section>}
      {previewQuery && preview.state === 'loading' && <p className="ov-note" role="status">Đang tải bản xem trước…</p>}
      {previewQuery && preview.state === 'error' && <p className="ov-error" role="alert">{preview.message}</p>}
      {previewQuery && preview.state === 'ready' && <>
        {preview.refreshError && <p className="ov-error" role="alert">{preview.refreshError}</p>}
        {preview.data.sections.map(([title, rows]) => <section className="ov-panel" key={title}>
          <h2>{title}</h2>
          <div className="ov-report-table-wrap">
            <table className="ov-table ov-report-table" aria-label={title}>
              <thead><tr>{rows[0]?.map((cell, index) => <th key={index} scope="col">{cell}</th>)}</tr></thead>
              <tbody>{rows.slice(1).map(([label, ...values], index) => <tr key={index}>
                <th scope="row">{label}</th>
                {values.map((value, column) => <td key={column} data-number={typeof value === 'number'}>
                  {typeof value === 'number' ? numberText(value, 2) : value}
                </td>)}
              </tr>)}</tbody>
            </table>
          </div>
        </section>)}
      </>}
      {canLoad && <section className="ov-panel">
        <h2>Lịch sử báo cáo</h2>
        {history.state === 'loading' && <p className="ov-note">Đang tải lịch sử…</p>}
        {history.state === 'error' && <p className="ov-error" role="alert">{history.message} <Button variant="text" onClick={history.retry}>Thử lại</Button></p>}
        {history.state === 'ready' && history.refreshError && <p className="ov-error" role="alert">{history.refreshError}</p>}
        {history.state === 'ready' && previousReports.length === 0 && !closed && <p className="ov-note">Chưa có báo cáo đã chốt trong kỳ.</p>}
        {previousReports.map(report => <div key={report._id} className="ov-report-history">
          <span>{formatDate(report.generated_at)} · {report._id.slice(0, 10)}</span>
          <DownloadFormats disabled={busy} onDownload={format => void download(report, format)}/>
        </div>)}
      </section>}
      {kind === 'stage' && (!admin || partner) && <LegacyRangeHistory
        key={partner} partner={admin ? partner : null} busy={busy} onDownload={(report, format) => void download(report, format)}/>}
    </div>
  </ResponsiveDialog>;
}


function LegacyRangeHistory({ partner, busy, onDownload }: {
  partner: string | null;
  busy: boolean;
  onDownload: (report: MonthlyReport, format: Format) => void;
}) {
  const [open, setOpen] = useState(false);
  const query = new URLSearchParams({kind:'range'});
  if (partner) query.set('partner', partner);
  const history = useResource<{reports: MonthlyReport[]}>(open ? `/overview/monthly?${query}` : null);
  return <details className="ov-panel ov-range-history" onToggle={e => setOpen(e.currentTarget.open)}>
    <summary>Báo cáo khoảng ngày đã lưu</summary>
    {open && <>
      {history.state === 'loading' && <p className="ov-note">Đang tải lịch sử…</p>}
      {history.state === 'error' && <p className="ov-error" role="alert">{history.message}
        <Button size="xs" variant="text" onClick={history.retry}>Thử lại</Button>
      </p>}
      {history.state === 'ready' && (history.data.reports.length ? history.data.reports.map(report => (
        <div key={report._id} className="ov-report-history">
          <span>{report.period_key?.split('_').map(dateText).join(' – ')} · {formatDate(report.generated_at)}</span>
          <DownloadFormats disabled={busy} onDownload={format => onDownload(report, format)}/>
        </div>
      )) : <p className="ov-note">Chưa có báo cáo khoảng ngày.</p>)}
    </>}
  </details>;
}
