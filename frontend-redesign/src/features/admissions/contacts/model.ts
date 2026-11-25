export type ContactRow = {
  contact_id: string; full_name?: string | null; email?: string | null; phone?: string | null;
  board?: string | null; province?: string | null; region?: string | null; exam_venue?: string | null;
  payment_status?: string | null; fee?: number | null; revenue?: number | null; channel?: string | null;
  channel_is_assumed?: boolean | null; segment?: string | null; drip?: string | null; pic?: string | null;
  first_touch?: string | null; web_registered_at?: string | null; dob?: string | null; cccd?: string | null;
  sources?: string[] | null; flags?: string[] | null; utm_partners?: string[] | null; promo_codes?: string[] | null;
  notes?: string | null; question?: string | null;
};
export type Option = {value: string; label: string};
export const groups = [
  ['board','Bảng thi'], ['region','Miền'], ['province','Tỉnh/thành'], ['payment_status','Thanh toán'],
  ['segment','Nhóm CRM'], ['channel','Kênh ghi nhận'], ['source','Nguồn dữ liệu'], ['pic','Người phụ trách'], ['venue','Điểm thi'],
] as const;
export type GroupKey = typeof groups[number][0];
export type FilterKey = GroupKey | 'date_from' | 'date_to';
export type Filters = Partial<Record<FilterKey,string>>;
export type ContactOptions = Record<Exclude<GroupKey,'segment'>,string[]> & {segment:Option[];date_min:string|null;date_max:string|null};
export type OptionsResponse = {viewing_partner:string|null; contacts?:ContactOptions};
export type ContactList = {total:number;page:number;page_size:number;rows:ContactRow[]};
export type Kpi = {total:number;web_registered:number;paid:number;paid_rate:number|null;revenue:number;unpaid_registered:number;potential_revenue:number;free:number;flagged:number;undated_contacts:number;undated_registrations:number;undated_paid:number;merged_records:number;leads_only:number};
export type Breakdown = {key:string|null;name?:string|null;count:number;web_registered:number;paid:number;revenue:number};
export type Timeline = {date:string;registrations:number;paid:number;new_contacts:number};
export const dimensions = [['by_board','Bảng thi'],['by_region','Miền'],['by_province','Tỉnh/thành'],['by_segment','Nhóm CRM'],['by_pic','Người phụ trách'],['by_source_combo','Tổ hợp nguồn'],['by_channel','Kênh ghi nhận'],['by_drip','Drip campaign'],['by_venue','Điểm thi']] as const;
export type Dimension = typeof dimensions[number][0];
export type Summary = {kpi:Kpi;timeline:Timeline[];heatmap?:{dow:number;hour:number;count:number}[];by_flag:{key:string|null;count:number}[]} & Record<Dimension,Breakdown[]>;
export const countsValid = (...counts:number[]) => counts.every(n=>Number.isSafeInteger(n)&&n>=0);
export const funnelValid = (total:number,web:number,paid:number) => countsValid(total,web,paid)&&total>=web&&web>=paid;
export const groupLabel = (r:Breakdown) => r.key == null || r.key === '' ? 'Chưa xác định' : r.name ? `${r.key} · ${r.name}` : r.key;
export function optionsFor(options:ContactOptions,key:GroupKey):Option[] {
  const values = key==='segment'?options.segment:(options[key]??[]).map(value=>({value,label:value}));
  return key==='pic'?[...values,{value:'__none__',label:'Chưa phân công'}]:values;
}
export function textValue(value:unknown):string {
  if(value==null||value==='')return '—';
  if(Array.isArray(value))return value.length?value.map(String).join(', '):'—';
  return String(value);
}
export function layoutForWidth(width:number) {return width<680?'compact':width<1000?'medium':'expanded';}

/** MongoDB ISO weekday (1=Monday), UTC hour, no client timezone shift. */
export function validHeatmapCell(row:{dow:number;hour:number;count:number}){return Number.isInteger(row.dow)&&row.dow>=1&&row.dow<=7&&Number.isInteger(row.hour)&&row.hour>=0&&row.hour<=23&&countsValid(row.count); }

/** Aggregate positive registration counts without guessing the precision of source timestamps. */
export function registrationPattern(cells:readonly {dow:number;hour:number;count:number}[]) {
  const weekdays=Array<number>(7).fill(0);
  const hours=new Set<number>();
  const counts=new Map<string,number>();
  let total=0;
  const invalid=()=>({valid:false,total:0,weekdays:Array<number>(7).fill(0),singleHour:false,counts:new Map<string,number>()});
  for(const cell of cells){
    if(!validHeatmapCell(cell))return invalid();
    const key=`${cell.dow}:${cell.hour}`;
    const count=(counts.get(key)??0)+cell.count;
    const day=weekdays[cell.dow-1]+cell.count;
    total+=cell.count;
    if(!countsValid(count,day,total))return invalid();
    counts.set(key,count);weekdays[cell.dow-1]=day;
    if(cell.count>0)hours.add(cell.hour);
  }
  return {valid:true,total,weekdays,singleHour:hours.size===1,counts};
}
