export type LeadRow = {
  source?: string|null; row_no?: number|null; contact_id?: string|null; result?: string|null;
  segment?: string|null; created_at?: string|null; full_name?: string|null; email?: string|null; phone?: string|null;
  board_interest?: string|null; province?: string|null; region?: string|null; campaign?: string|null;
  platform?: string|null; heard_from?: string|null; pic?: string|null; question?: string|null; note?: string|null;
  wants_talkshow?: boolean|null; self_declared?: string|null;
};
export type Option={value:string;label:string};
export const groups=[['source','Nguồn biểu mẫu'],['result','Kết quả đối soát'],['board','Bảng thi quan tâm'],['region','Miền'],['segment','Nhóm CRM'],['campaign','Chiến dịch'],['platform','Nền tảng'],['pic','Người phụ trách']] as const;
export type GroupKey=typeof groups[number][0];
export type FilterKey=GroupKey|'date_from'|'date_to';
export type Filters=Partial<Record<FilterKey,string>>;
export type LeadOptions=Record<GroupKey,string[]>;
export type OptionsResponse={viewing_partner:string|null;leads?:LeadOptions};
export type LeadList={total:number;page:number;page_size:number;rows:LeadRow[]};
export type Kpi={total:number;unique_contacts:number;new_leads:number;in_data:number;dup_external:number;wants_talkshow:number;self_declared_registered:number};
export type Breakdown={key:string|null;count:number};
export type SourceResult={source:string|null;result:string|null;count:number};
export type Week={week:string;source:string|null;start:string|null;count:number};
export const dimensions=[['by_source','Nguồn biểu mẫu'],['by_board','Bảng thi quan tâm'],['by_region','Miền'],['by_segment','Nhóm CRM'],['by_pic','Người phụ trách'],['by_campaign','Chiến dịch'],['by_platform','Nền tảng'],['by_heard_from','Biết Talkshow qua'],['by_self_declared','Tình trạng tự khai']] as const;
export type Dimension=typeof dimensions[number][0];
export type Summary={kpi:Kpi;by_source_result:SourceResult[];weekly:Week[]} & Record<Dimension,Breakdown[]>;
export const countsValid=(...counts:number[])=>counts.every(n=>Number.isSafeInteger(n)&&n>=0);
export function optionsFor(o:LeadOptions,k:GroupKey):Option[]{const values=(o[k]??[]).map(value=>({value,label:value}));return k==='pic'?[...values.filter(v=>v.value!=='__none__'),{value:'__none__',label:'Chưa phân công (null)'}]:values;}
export function textValue(v:unknown){return v==null||v===''?'—':String(v);}
export function groupLabel(v:string|null){return v===null?'Chưa có giá trị (null)':v===''?'Giá trị rỗng':v;}
export function layoutForWidth(w:number){return w<680?'compact':w<1000?'medium':'expanded';}
export const resultLabels=['Lead mới','Đã có trong Data','Trùng trong form ngoài'] as const;
export function resultLabel(v:string|null|undefined){return v==null||v===''?'Chưa xác định':v==='Đã có trong Data'?'Đã có trong dữ liệu website':v;}
export function canExport(canViewPii:boolean){return canViewPii;}
