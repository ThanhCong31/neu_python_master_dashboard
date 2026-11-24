import type { ReactNode } from 'react';
import { compactMoney, moneyText, numberText, percentText } from '@/shared/format';
import type { CrmKpi } from '../model';
export function Metric({ label, value, hint, hero=false, className='', exact }: { label:string; value:string; hint?:ReactNode; hero?:boolean; className?:string; exact?:string }) {
  return <div className={`ov-metric ${hero?'ov-hero':''} ${className}`}><dt>{label}</dt><dd className="ov-value" title={exact}>{value}</dd>{hint&&<dd className="ov-metric-hint">{hint}</dd>}</div>;
}
export function AdmissionsMetrics({ k }: { k:CrmKpi }) {
  return <dl className="ov-metrics">
    <Metric hero label="Đăng ký trên website" value={numberText(k.web_registered)} hint={<>Tỷ lệ đóng phí / đăng ký: <strong>{percentText(k.paid_rate)}</strong></>}/>
    <Metric label="Liên hệ duy nhất" value={numberText(k.total)}/>
    <Metric label="Đã đóng phí" value={numberText(k.paid)} hint={k.free>0?`${numberText(k.free)} hồ sơ miễn phí`:undefined}/>
    <Metric className="ov-revenue" label="Lệ phí ghi nhận" value={compactMoney(k.revenue)} exact={moneyText(k.revenue)} hint={moneyText(k.revenue)===compactMoney(k.revenue)?undefined:moneyText(k.revenue)}/>
  </dl>;
}
