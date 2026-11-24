import {groups,optionsFor,type ContactOptions,type Filters,type FilterKey,type Dimension,type GroupKey} from './model.ts';
export const filterKeys:FilterKey[]=['date_from','date_to',...groups.map(([key])=>key)];
export const sortFields=[['contact_id','Mã hồ sơ'],['full_name','Họ tên'],['board','Bảng thi'],['province','Tỉnh/thành'],['payment_status','Thanh toán'],['revenue','Doanh thu'],['channel','Kênh'],['segment','Nhóm CRM'],['pic','Người phụ trách'],['first_touch','Ngày tiếp xúc đầu tiên'],['web_registered_at','Ngày đăng ký web']] as const;
export function split(raw?:string){return [...new Set((raw??'').split(',').map(x=>x.trim()).filter(Boolean))].sort();}
export function normalize(f:Filters):Filters {
  const result:Filters={};
  for(const key of filterKeys){const value=key.startsWith('date_')?f[key]?.trim():split(f[key]).join(',');if(value)result[key]=value;}
  return result;
}
export function parseFilters(params:URLSearchParams):Filters {const result:Filters={};for(const key of filterKeys){const v=params.get(key);if(v)result[key]=v;}return normalize(result);}
export function writeFilters(params:URLSearchParams,filters:Filters){const next=new URLSearchParams(params);for(const k of filterKeys)next.delete(k);for(const [k,v] of Object.entries(normalize(filters)))next.set(k,v);return next;}
function validDate(s:string){if(s.startsWith('0000')||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s;}
export function filterError(f:Filters,opts?:ContactOptions):string|null {
  if([f.date_from,f.date_to].some(d=>d&&!validDate(d)))return 'Ngày lọc không hợp lệ.';
  if(f.date_from&&f.date_to&&f.date_from>f.date_to)return 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.';
  if(opts)for(const [k,label] of groups){const allowed=new Set(optionsFor(opts,k).map(o=>o.value));if(split(f[k]).some(v=>!allowed.has(v)))return `${label}: có lựa chọn không còn trong phạm vi. Hãy sửa hoặc xóa bộ lọc.`;}
  return null;
}
export const searchValue=(q:string)=>q.trim().slice(0,80);
export function validSort(s:string){return sortFields.some(([k])=>s===k||s===`-${k}`)?s:'contact_id';}
export function makePath(kind:'options'|'list'|'summary'|'csv',partner:string|null,filters:Filters={},q='',page=1,size=20,sort='contact_id') {
  const params=new URLSearchParams();if(partner)params.set('partner',partner);
  if(kind!=='options')for(const [k,v] of Object.entries(normalize(filters)))params.set(k,v);
  if(kind==='list'||kind==='csv'){const search=searchValue(q);if(search)params.set('q',search);}
  if(kind==='list'){params.set('page',String(page));params.set('page_size',String(size));params.set('sort',validSort(sort));}
  if(kind==='csv')params.set('format','csv');
  const base=kind==='options'?'/meta/options':kind==='summary'?'/contacts/summary':'/contacts/list';return base+(params.size?'?'+params:'');
}
export const pageCount=(total:number,size:number)=>Math.max(1,Math.ceil(total/size));

/** Only drill down through exact, representable filters; source combinations are not source membership. */
export function exactGroupFilter(dimension:Dimension,value:string|null,options?:ContactOptions):{key:GroupKey;value:string}|null {
  const mapping:Partial<Record<Dimension,GroupKey>>={by_board:'board',by_region:'region',by_province:'province',by_segment:'segment',by_pic:'pic',by_channel:'channel'};
  const key=mapping[dimension];if(!key||!options)return null;const v=value===null&&key==='pic'?'__none__':value;
  return v&&!v.includes(',')&&optionsFor(options,key).some(o=>o.value===v)?{key,value:v}:null;
}
