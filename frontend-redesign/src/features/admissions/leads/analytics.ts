import {countsValid,resultLabels,type Kpi,type Week,type SourceResult} from './model.ts';
const DAY=86400000;
/** ISO week Monday, calculated in UTC; never use the first submitted row as week start. */
export function weekMonday(key:string):number|null {
  const m=/^(\d{4})-W(0[1-9]|[1-4]\d|5[0-3])$/.exec(key);if(!m||m[1]==='0000')return null;
  const year=Number(m[1]),week=Number(m[2]);const jan4=new Date(`${m[1]}-01-04T00:00:00Z`);
  const first=jan4.getTime()-((jan4.getUTCDay()+6)%7)*DAY;const monday=first+(week-1)*7*DAY;
  return new Date(monday+3*DAY).getUTCFullYear()===year?monday:null;
}
function weekKey(monday:number){const year=new Date(monday+3*DAY).getUTCFullYear();const prefix=String(year).padStart(4,'0');const first=weekMonday(`${prefix}-W01`)!;return `${prefix}-W${String(Math.round((monday-first)/(7*DAY))+1).padStart(2,'0')}`;}
export function weekSeries(rows:Week[],total:number){
  const valid=countsValid(total)&&rows.every(r=>countsValid(r.count)&&weekMonday(r.week)!==null);
  const count=rows.reduce((a,r)=>a+r.count,0);const sources=[...new Set(rows.map(r=>r.source))].sort((a,b)=>String(a).localeCompare(String(b),'vi'));
  const map=new Map<string,Map<string|null,number>>();for(const r of rows){const m=map.get(r.week)??new Map();m.set(r.source,(m.get(r.source)??0)+r.count);map.set(r.week,m);}
  const observed=[...map.keys()].sort();const first=observed.length?weekMonday(observed[0]):null;const last=observed.length?weekMonday(observed[observed.length-1]):null;
  // A bounded chart only; table always receives every original row.
  const span=first!==null&&last!==null?(last-first)/(7*DAY)+1:0;const weeks:string[]=[];
  if(valid&&span>0&&last!==null&&first!==null){const start=Math.max(first,last-51*7*DAY);for(let t=start;t<=last;t+=7*DAY)weeks.push(weekKey(t));}
  return {valid:valid&&count<=total,count,missing:valid&&count<=total?total-count:null,sources,weeks,limited:span>52,values:(source:string|null)=>weeks.map(w=>map.get(w)?.get(source)??0)};
}
export function resultCounts(k:Kpi,rows:SourceResult[]){
  const known=[k.new_leads,k.in_data,k.dup_external];const sum=known.reduce((a,b)=>a+b,0);
  const valid=countsValid(k.total,...known)&&sum<=k.total&&rows.every(r=>countsValid(r.count))&&rows.reduce((a,r)=>a+r.count,0)===k.total&&resultLabels.every((label,i)=>rows.filter(r=>r.result===label).reduce((a,r)=>a+r.count,0)===known[i]);
  return {valid,groups:[...resultLabels.map((label,i)=>({label,count:known[i]})),...(sum<k.total?[{label:'Khác / chưa xác định',count:k.total-sum}]:[])]};
}
