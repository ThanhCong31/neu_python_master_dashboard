import { useEffect, useState } from 'react';
import type { ChartLayout } from './responsive';
/** Resolve the actual Material roles rather than passing CSS var() strings to canvas. */
function readPalette() {
  const style=getComputedStyle(document.documentElement);
  const color=(name:string)=>style.getPropertyValue(`--ex-color-${name}`).trim();
  return { primary:color('primary'), secondary:color('secondary'), onSecondaryContainer:color('on-secondary-container'), tertiary:color('tertiary'), error:color('error'), text:color('on-surface'), muted:color('on-surface-variant'), grid:color('outline-variant'), surface:color('surface-container-highest'), outline:color('outline') };
}
export type ChartPalette=ReturnType<typeof readPalette>;
export function useChartPalette() {
  const [palette,setPalette]=useState(readPalette);
  useEffect(()=>{
    const update=()=>setPalette(readPalette());
    window.addEventListener('neu-theme-change',update);
    // System appearance changes in V9 update html.dark without emitting an event.
    const observer=new MutationObserver(update);
    observer.observe(document.documentElement,{attributes:true,attributeFilter:['class','style']});
    update();
    return ()=>{window.removeEventListener('neu-theme-change',update);observer.disconnect();};
  },[]);
  return palette;
}
export function chartBase(p:ChartPalette, reducedMotion:boolean, layout?:ChartLayout) {
  return {backgroundColor:'transparent',textStyle:{fontFamily:'Inter Variable, sans-serif',color:p.text,fontSize:12},animation:!reducedMotion,animationDuration:250,animationDurationUpdate:180,tooltip:{trigger:'axis',triggerOn:layout?.compact?'click':'mousemove|click',renderMode:'richText',confine:true,backgroundColor:p.surface,borderColor:p.outline,textStyle:{color:p.text,fontFamily:'Inter Variable, sans-serif',fontSize:layout?.compact?12:13},padding:layout?.compact?8:12},aria:{enabled:true}};
}
