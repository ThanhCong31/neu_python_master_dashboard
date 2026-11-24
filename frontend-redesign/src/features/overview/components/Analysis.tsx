import { Component, lazy, Suspense, useCallback, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Table2, ChartNoAxesCombined } from 'lucide-react';
import { Button, ToggleButton } from '@/components/expressive/button';
import { numberText, moneyText, percentText, dateText } from '@/shared/format';
import { ratio, validFunnel, gradeOrder, gradeRows, type CrmKpi, type OverviewData, type TimelinePoint } from '../model';
import { useChartPalette, type ChartPalette } from '@/shared/charts/theme';
import { categoryTickIndices, shortChartDate, type ChartLayout } from '@/shared/charts/responsive';
const Chart=lazy(()=>import('@/shared/charts/Chart'));
// An unavailable chart chunk must not hide the rest of the dashboard or the data table.
class ChartBoundary extends Component<{children:ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<p className="ov-note" role="alert">Không tải được biểu đồ. Chọn “Bảng số liệu” để tiếp tục.</p>:this.props.children;}
}
export function DetailLink({ to, children }: { to?:string; children:string }) { return to?<Link className="ov-link focus-ring" to={to}>{children}<ArrowUpRight size={17} aria-hidden="true"/></Link>:null; }
export function Funnel({ k }: { k:CrmKpi }) {
  const steps=[{name:'Liên hệ duy nhất',value:k.total,previous:null},{name:'Đăng ký website',value:k.web_registered,previous:k.total},{name:'Đã đóng phí',value:k.paid,previous:k.web_registered}];
  const valid=validFunnel(k);
  return <section className="ov-panel"><div><h2>Tiến trình tuyển sinh</h2><p className="ov-note">Chuyển đổi trên cùng tập liên hệ.</p></div>
    {!valid&&<p className="ov-error" role="alert">Số lượng giữa các bước chưa nhất quán; không vẽ tỷ lệ cho tới khi đối soát.</p>}
    <ol className="ov-funnel">{steps.map((s,i)=><li key={s.name}><div className="ov-funnel-label"><span>{s.name}</span><strong>{numberText(s.value)}</strong></div>{valid&&<div className="ov-track" aria-hidden="true"><div className={`ov-fill ov-step-${i}`} style={{width:`${(ratio(s.value,k.total)??0)*100}%`}}/></div>}{s.previous!==null&&valid&&<p className="ov-note">{percentText(ratio(s.value,s.previous))} so với bước trước</p>}</li>)}</ol>
  </section>;
}
export function FollowUp({ k, to }: { k:CrmKpi; to?:string }) {
  return <section className="ov-panel ov-follow"><div><h2>Hồ sơ chưa ghi nhận đóng phí</h2><p className="ov-note">Đã đăng ký trên website</p></div><div className="ov-follow-value">{numberText(k.unpaid_registered)}</div><div><p className="ov-note">Tổng lệ phí của nhóm này</p><strong className="ov-follow-money">{moneyText(k.potential_revenue)}</strong></div><p className="ov-note">Không phải doanh thu dự báo. Có thể bao gồm hồ sơ miễn phí; cần đối soát trước khi liên hệ.</p><DetailLink to={to}>Xem liên hệ & chuyển đổi</DetailLink></section>;
}
function Table({ headers, rows }: {headers:string[];rows:(string|number)[][]}) {
  return <div className="ov-table-scroll focus-ring" tabIndex={0} role="region" aria-label="Bảng số liệu"><table className="ov-table"><thead><tr>{headers.map(h=><th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((v,j)=>j===0?<th key={j} scope="row">{v}</th>:<td key={j}>{typeof v==='number'?numberText(v):v}</td>)}</tr>)}</tbody></table></div>;
}
// One definition for plot, legend and table: Material roles with solid lines.
const timelineSeries = [
  { key:'contacts', name:'Liên hệ', color:'onSecondaryContainer', daily:'new_contacts', cumulative:'cum_contacts' },
  { key:'registrations', name:'Đăng ký web', color:'primary', daily:'registrations', cumulative:'cum_registrations' },
  { key:'paid', name:'Đã đóng phí', color:'tertiary', daily:'paid', cumulative:'cum_paid' },
] as const;
type TimelineSeriesKey = typeof timelineSeries[number]['key'];

export function Timeline({ timeline, k }: { timeline:TimelinePoint[]; k:CrmKpi }) {
  const [cumulative,setCumulative]=useState(true);
  const [table,setTable]=useState(false);
  const [visible,setVisible]=useState<TimelineSeriesKey[]>(()=>timelineSeries.map(s=>s.key));
  const palette=useChartPalette();
  const toggleSeries=(key:TimelineSeriesKey)=>setVisible(current=>
    current.includes(key)?(current.length===1?current:current.filter(k=>k!==key)):[...current,key]);
  const makeOption=useCallback((p:ChartPalette, layout:ChartLayout)=>{
    const dates=timeline.map(t=>dateText(t.date));
    const multipleYears=new Set(timeline.map(t=>t.date.slice(0,4))).size>1;
    const ticks=categoryTickIndices(dates.length,Math.max(2,layout.tickBudget-(multipleYears?1:0)));
    return {
      grid:{left:layout.compact?2:12,right:multipleYears?28:22,top:12,bottom:layout.compact?12:24,containLabel:true},
      // Keep complete dates for axis-triggered tooltips; only axis captions are abbreviated.
      xAxis:{type:'category',boundaryGap:false,data:dates,axisLabel:{color:p.muted,fontSize:layout.compact?11:12,margin:8,interval:(index:number)=>ticks.has(index),formatter:(value:string)=>shortChartDate(value,multipleYears),hideOverlap:true,showMinLabel:true,showMaxLabel:true},axisLine:{lineStyle:{color:p.grid}},axisTick:{show:false}},
      yAxis:{type:'value',min:0,minInterval:1,splitNumber:layout.compact?4:5,axisLabel:{color:p.muted,fontSize:layout.compact?11:12,margin:6,formatter:(value:number)=>numberText(value)},splitLine:{lineStyle:{color:p.grid,opacity:.55}},axisLine:{show:false}},
      series:timelineSeries.filter(s=>visible.includes(s.key)).map(s=>({
        name:s.name,type:'line',data:timeline.map(t=>t[cumulative?s.cumulative:s.daily]),
        showSymbol:timeline.length===1,symbolSize:8,smooth:false,
        itemStyle:{color:p[s.color]},
        lineStyle:{color:p[s.color],width:3,type:'solid'},
        emphasis:{focus:'series'},
      })),
    };
  },[timeline,cumulative,visible]);
  return <section className="ov-panel ov-chart-panel ov-timeline">
    <div className="ov-chart-heading">
      <div><h2>Hoạt động tuyển sinh</h2><p className="ov-note">{cumulative?'Cộng dồn từ ngày đầu có dữ liệu đến ngày đang xem.':'Số hồ sơ theo từng ngày tiếp xúc đầu tiên / đăng ký web.'}</p></div>
    </div>
    {!timeline.length?<p className="ov-note">Không có mốc thời gian trong phạm vi này.</p>:<>
      <div className="ov-chart-toolbar"><div className="ov-chart-controls" role="group" aria-label="Chế độ thời gian">
        <ToggleButton variant="tonal" size="sm" pressed={!cumulative} onClick={()=>setCumulative(false)}>Theo ngày</ToggleButton>
        <ToggleButton variant="tonal" size="sm" pressed={cumulative} onClick={()=>setCumulative(true)}>Lũy kế</ToggleButton>
      </div><Button className="ov-chart-view" variant="text" size="sm" icon={table?<ChartNoAxesCombined/>:<Table2/>} onClick={()=>setTable(v=>!v)}>{table?'Biểu đồ':'Bảng số liệu'}</Button></div>
      {table?<Table headers={['Ngày',...timelineSeries.map(s=>s.name)]} rows={timeline.map(t=>[dateText(t.date),...timelineSeries.map(s=>t[cumulative?s.cumulative:s.daily])])}/>:<>
        <div className="ov-legend" role="group" aria-label="Chú giải biểu đồ — chọn để ẩn hoặc hiện đường">
          {timelineSeries.map(s=>{
            const active=visible.includes(s.key);
            const last=active&&visible.length===1;
            return <button key={s.key} type="button" className="ov-legend-item focus-ring" aria-pressed={active} aria-disabled={last||undefined} title={last?'Cần giữ ít nhất một đường':active?'Ẩn đường '+s.name:'Hiện đường '+s.name} onClick={()=>toggleSeries(s.key)}>
              <svg width="34" height="14" viewBox="0 0 38 14" aria-hidden="true" focusable="false"><line x1="2" y1="7" x2="36" y2="7" stroke={palette[s.color]} strokeWidth="3"/></svg>
              <span>{s.name}</span>
            </button>;
          })}
        </div>
        <ChartBoundary><Suspense fallback={<div className="ov-chart-loading" role="status">Đang tải biểu đồ…</div>}><Chart label={cumulative?"Biểu đồ hoạt động tuyển sinh lũy kế":"Biểu đồ hoạt động tuyển sinh theo ngày"} makeOption={makeOption} height={300} compactHeight={240}/></Suspense></ChartBoundary>
      </>}
    </>}
    <p className="ov-note">Hồ sơ đã đóng phí được nhóm theo ngày đăng ký web, không phải ngày phát sinh giao dịch.</p>
    {(k.undated_contacts>0||k.undated_registrations>0||k.undated_paid>0)&&<p className="ov-note">Không có ngày: {numberText(k.undated_contacts)} liên hệ, {numberText(k.undated_registrations)} đăng ký, {numberText(k.undated_paid)} đăng ký đã đóng phí. Các chỉ số tổng vẫn bao gồm chúng.</p>}
  </section>;
}
export function Grades({ grades }: {grades:NonNullable<OverviewData['exams']>['grades']}) {
  const [table,setTable]=useState(false); const rows=gradeRows(grades);
  const makeOption=useCallback((p:ChartPalette,layout:ChartLayout)=>({aria:{enabled:true,decal:{show:true}},grid:{left:layout.compact?2:12,right:layout.compact?22:28,top:34,bottom:layout.compact?12:20,containLabel:true},legend:{type:'scroll',top:0,left:0,right:0,itemWidth:layout.compact?12:20,textStyle:{color:p.text,fontSize:layout.compact?11:12},pageTextStyle:{color:p.text},pageIconColor:p.primary,pageIconInactiveColor:p.grid},yAxis:{type:'category',inverse:true,data:gradeOrder,axisLabel:{color:p.muted,fontSize:layout.compact?11:12,margin:6},axisTick:{show:false},axisLine:{lineStyle:{color:p.grid}}},xAxis:{type:'value',min:0,minInterval:1,splitNumber:layout.compact?3:5,axisLabel:{color:p.muted,fontSize:layout.compact?11:12,hideOverlap:true},splitLine:{lineStyle:{color:p.grid,opacity:.55}}},series:gradeRows(grades).map((r,i)=>({name:r.board,type:'bar',data:r.counts,barMaxWidth:layout.compact?18:26,itemStyle:{color:[p.primary,p.tertiary,p.secondary,p.outline][i%4],borderRadius:[0,5,5,0]},label:{show:!layout.narrow,position:'right',color:p.text,fontSize:layout.compact?11:12,formatter:(params:{value:unknown})=>params.value===0?'':String(params.value)}}))}),[grades]);
  return <section className="ov-panel ov-chart-panel"><div className="ov-panel-head"><div><h2>Xếp loại vòng loại</h2><p className="ov-note">Bộ dữ liệu giả lập PM119 · phân theo bảng thi</p></div>{rows.length>0&&<Button variant="text" size="sm" onClick={()=>setTable(v=>!v)}>{table?'Biểu đồ':'Bảng số liệu'}</Button>}</div>{!rows.length?<p className="ov-note">Chưa có kết quả xếp loại.</p>:table?<Table headers={['Bảng',...gradeOrder]} rows={rows.map(r=>[r.board,...r.counts])}/>:<ChartBoundary><Suspense fallback={<div className="ov-chart-loading" role="status">Đang tải biểu đồ…</div>}><Chart label="Phân bố xếp loại vòng loại theo bảng" makeOption={makeOption} compactHeight={300}/></Suspense></ChartBoundary>}<p className="ov-note">Giỏi ≥ 800 · Khá ≥ 650 · Trung bình ≥ 500 · Yếu dưới 500. Theo quy tắc ETL hiện tại.</p></section>;
}
