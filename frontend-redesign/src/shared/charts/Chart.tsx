import { useEffect, useRef, useState } from 'react';
import { init, use, type EChartsCoreOption } from 'echarts/core';
import { LineChart, BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, AriaComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useReducedMotion } from '@/lib/expressive/use-reduced-motion';
import { useChartPalette, chartBase, type ChartPalette } from './theme';
import { chartLayoutForWidth, type ChartLayout } from './responsive';
use([LineChart,BarChart,GridComponent,TooltipComponent,LegendComponent,AriaComponent,CanvasRenderer]);
/** Owns ECharts lifecycle. The caller owns semantics, data, and an equivalent HTML table. */
export default function Chart({ label, makeOption, height=300, compactHeight=height }: {
  label:string;
  makeOption:(palette:ChartPalette, layout:ChartLayout)=>EChartsCoreOption;
  height?:number;
  compactHeight?:number;
}) {
  const host=useRef<HTMLDivElement>(null);
  const chart=useRef<ReturnType<typeof init>|null>(null);
  const [error,setError]=useState(false);
  const [layout,setLayout]=useState<ChartLayout|null>(null);
  const palette=useChartPalette(); const reduced=useReducedMotion();
  useEffect(()=>{
    const el=host.current; if(!el)return;
    let mounted=true;
    let lastWidth=0, lastHeight=0;
    const measure=()=>{
      if(!mounted)return;
      const width=el.clientWidth, height=el.clientHeight;
      if(width<=0||height<=0)return; // wait for a measurable host
      try {
        if(!chart.current)chart.current=init(el,undefined,{renderer:'canvas'});
        else if(width!==lastWidth||height!==lastHeight)chart.current.resize();
        lastWidth=width; lastHeight=height;
        const next=chartLayoutForWidth(width);
        setLayout(previous=>previous?.tier===next.tier?previous:next);
      } catch {setError(true);}
    };
    measure();
    const observer=new ResizeObserver(measure); observer.observe(el);
    void document.fonts.ready.then(()=>{
      if(mounted&&chart.current&&!chart.current.isDisposed())chart.current.resize();
    }).catch(()=>{});
    return ()=>{mounted=false;observer.disconnect();chart.current?.dispose();chart.current=null;};
  },[]);
  useEffect(()=>{
    if(!layout)return;
    try {chart.current?.setOption({...chartBase(palette,reduced,layout),...makeOption(palette,layout)},{notMerge:true});} catch {setError(true);}
  },[palette,reduced,makeOption,layout]);
  return <div className="dashboard-chart-frame" style={{minWidth:0,width:'100%'}}>{error&&<p role="alert" className="ov-note">Không hiển thị được biểu đồ. Chọn “Bảng số liệu” để xem dữ liệu.</p>}<div className="dashboard-chart-host" ref={host} role="img" aria-label={label} style={{height:layout?.compact?compactHeight:height,width:'100%',minWidth:0,visibility:error?'hidden':undefined}}/></div>;
}
