import type {ChartPalette} from './theme';
import type {ChartLayout} from './responsive';
export type GradeSeries={board:string;counts:number[]};
export function boardColor(board:string,p:ChartPalette,index=0){
  if(board==='Bảng A')return p.primary;
  if(board==='Bảng B')return p.tertiary;
  return [p.secondary,p.onSecondaryContainer,p.outline][index%3];
}
export function gradeChartable(categories:string[],rows:GradeSeries[]){
  return categories.length>0&&categories.length<=12&&rows.length>0&&rows.length<=4&&rows.every(r=>r.counts.length===categories.length&&r.counts.every(n=>Number.isSafeInteger(n)&&n>=0));
}
export function gradeChartOption(p:ChartPalette,l:ChartLayout,categories:string[],rows:GradeSeries[]){
  return {legend:{},aria:{enabled:true,decal:{show:false}},
    grid:{left:4,right:l.compact?16:48,top:12,bottom:12,containLabel:true},
    yAxis:{type:'category',inverse:true,data:categories,axisLabel:{color:p.muted,fontSize:l.compact?11:13,margin:8,width:l.narrow?72:l.compact?104:140,overflow:'truncate'},axisTick:{show:false},axisLine:{show:false}},
    xAxis:{type:'value',min:0,minInterval:1,splitNumber:l.compact?3:5,axisLabel:{color:p.muted,fontSize:l.compact?11:12,hideOverlap:true},axisTick:{show:false},axisLine:{show:false},splitLine:{lineStyle:{color:p.grid,opacity:.5}}},
    series:rows.map((r,i)=>({name:r.board,type:'bar',data:r.counts,barMaxWidth:l.compact?16:24,barGap:'30%',itemStyle:{color:boardColor(r.board,p,i),borderRadius:[0,4,4,0]},label:{show:!l.compact&&rows.every(row=>row.counts.every(n=>n<10000)),position:'right',color:p.text,fontSize:l.compact?11:13,formatter:(params:{value:unknown})=>params.value===0?'':String(params.value)}}))};
}
