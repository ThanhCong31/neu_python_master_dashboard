export type Benefit = {item:string;status:string|null;progress:number|null;placement:string|null;schedule:string|null;note:string|null};
export type MediaReach = {channel:string|null;reach:number|null;engagement:number|null;engagement_rate:number|null;importance:number|null};
export type Summary = {benefits:Benefit[];reach:MediaReach[]};
export const progress=(value:unknown):number|null=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=1?value:null;
export function metrics(data:Summary) {
  const values=data.benefits.map(r=>progress(r.progress)).filter((n):n is number=>n!==null);
  const total=(key:'reach'|'engagement')=>{const points=data.reach.map(r=>r[key]).filter((n):n is number=>typeof n==='number'&&Number.isFinite(n));return points.length?points.reduce((a,b)=>a+b,0):null;};
  return {average:values.length?values.reduce((a,b)=>a+b,0)/values.length:null,complete:values.filter(n=>n===1).length,total:data.benefits.length,reach:total('reach'),engagement:total('engagement')};
}
export function benefitStatus(benefit:Benefit) {
  const value=progress(benefit.progress);
  const text=benefit.status?.trim()||'Chưa có trạng thái';
  const completed=/^hoàn thành(?:\s|$)/iu.test(text)&&value===1;
  const inProgress=/^đang thực hiện(?:\s|$)/iu.test(text)||(/^hoàn thành(?:\s|$)/iu.test(text)&&value!==null&&value>0&&value<1);
  const tone=completed?'primary' as const:inProgress?'tertiary' as const:'neutral' as const;
  const match=text.match(/(\d+(?:[.,]\d+)?)\s*%\s*$/);
  const duplicatePercent=value!==null&&match!==null&&Math.abs(Number(match[1].replace(',','.'))-value*100)<.05;
  return {text,tone,value,duplicatePercent};
}
