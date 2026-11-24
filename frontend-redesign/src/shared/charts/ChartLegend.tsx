import type { PlotSeries } from './chart-style';
import './chart.css';
export function ChartLegend({series,hidden,onToggle}:{series:PlotSeries[];hidden:readonly number[];onToggle:(index:number)=>void}){
  if(!series.length)return null;
  return <div className="dashboard-chart-legend" role="group" aria-label="Chú giải biểu đồ — chọn để ẩn hoặc hiện dữ liệu">
    {series.map((s,i)=>{const active=!hidden.includes(i);const last=active&&series.length-hidden.length===1;const color=String(s.itemStyle?.color??s.lineStyle?.color??'currentColor');return <button key={`${s.name}-${i}`} type="button" className="dashboard-chart-legend-item focus-ring" aria-pressed={active} aria-disabled={last||undefined} title={last?'Cần giữ ít nhất một nhóm':undefined} onClick={()=>{if(!last)onToggle(i)}}><span aria-hidden="true" className="dashboard-chart-swatch" data-line={s.type==='line'||undefined} style={{backgroundColor:color}}/><span>{s.name??`Nhóm ${i+1}`}</span></button>})}
  </div>;
}
