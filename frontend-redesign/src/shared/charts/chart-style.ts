import type { ChartLayout } from './responsive';

/** Data marks, not card shapes. The top/right cap is rounded, the baseline and stack seams are square. */
export const BAR_RADIUS = 4;
export type PlotSeries = {
  name?: string; type?: string; stack?: string; data?: unknown[];
  itemStyle?: Record<string, unknown>; lineStyle?: Record<string, unknown>;
  [key: string]: unknown;
};
export function barValue(datum:unknown):number|null {
  const v=typeof datum==='object'&&datum!==null&&'value' in datum?datum.value:datum;
  return typeof v==='number'&&Number.isFinite(v)?v:null;
}
export function styleSeries(series:PlotSeries[],horizontal:boolean):PlotSeries[] {
  const rounded=horizontal?[0,BAR_RADIUS,BAR_RADIUS,0]:[BAR_RADIUS,BAR_RADIUS,0,0];
  return series.map((s,i)=>{
    if(s.type==='line')return {...s,lineStyle:{...s.lineStyle,width:3,type:'solid'}};
    if(s.type!=='bar'||!Array.isArray(s.data))return s;
    // Current dashboard bars are nonnegative counts. Do not reshape unsupported negative/vector data.
    if(s.data.some(v=>(barValue(v)===null&&v!==null&&v!==undefined)||(barValue(v)??0)<0))return s;
    if(!s.stack)return {...s,itemStyle:{...s.itemStyle,borderRadius:rounded}};
    const above=series.slice(i+1).filter(t=>t.type==='bar'&&t.stack===s.stack&&t.xAxisIndex===s.xAxisIndex&&t.yAxisIndex===s.yAxisIndex);
    return {...s,itemStyle:{...s.itemStyle,borderRadius:0},data:s.data.map((datum,j)=>{
      const v=barValue(datum);if(v===null)return datum;
      const outer=v>0&&!above.some(t=>(barValue(t.data?.[j])??0)>0);
      const original=typeof datum==='object'&&datum!==null?datum as Record<string,unknown>:{value:v};
      const itemStyle=original.itemStyle as Record<string,unknown>|undefined;
      return {...original,itemStyle:{...itemStyle,borderRadius:outer?rounded:0}};
    })};
  });
}
/** Reserve more room for two-axis plots with long group names, never enlarge the plot beyond its host. */
export function groupLabelWidth(l:ChartLayout){return l.narrow?72:l.compact?104:l.tier==='medium'?140:180;}
export function chartTickBudget(l:ChartLayout,labelCharacters:number){
  return Math.max(2,l.tickBudget-(labelCharacters>=8?1:0));
}
export function sourceRole(source:string|null,index=0){
  if(source==='Talkshow'||source==='Talkshow Google Form')return 'primary';
  if(source==='FB Lead Form'||source==='FB Lead Form v2')return 'tertiary';
  return (['secondary','onSecondaryContainer'] as const)[index%2];
}
export function resultRole(result:string|null){
  if(result==='Lead mới')return 'primary';
  if(result==='Đã có trong Data')return 'tertiary';
  if(result==='Trùng trong form ngoài')return 'secondary';
  return 'onSecondaryContainer';
}

/** EChartsCoreOption exposes option fields as unknown; narrow before reading them. */
function isAxisRecord(axis:unknown):axis is Record<string,unknown>{
  return typeof axis==='object'&&axis!==null&&!Array.isArray(axis);
}
export function isCategoryAxis(axis:unknown):boolean {
  // Current dashboard plots use one axis per direction.
  const first=Array.isArray(axis)?axis[0]:axis;
  return isAxisRecord(first)&&first.type==='category';
}
/** The chart host uses the same typography, low-emphasis grid and tick treatment across features. */
export function styleAxis(axis:unknown,l:ChartLayout,colors:{muted:string;grid:string}):unknown {
  if(Array.isArray(axis))return axis.map(a=>styleAxis(a,l,colors));
  if(!isAxisRecord(axis))return axis;
  const label=axis.axisLabel as Record<string,unknown>|undefined;
  const split=axis.splitLine as Record<string,unknown>|undefined;
  return {...axis,axisLabel:{color:colors.muted,margin:8,hideOverlap:true,...label,fontSize:l.compact?11:12},axisTick:{show:false,...axis.axisTick as object},
    ...(axis.type==='value'?{axisLine:{show:false,...axis.axisLine as object},splitLine:{...split,lineStyle:{...split?.lineStyle as object,color:colors.grid,opacity:.55}}}:{})};
}
