import {groups,type Filters,type Options,type OptionsResponse} from './model.ts';
export const split=(value?:string)=>[...new Set((value??'').split(',').map(v=>v.trim()).filter(Boolean))].sort();
export function normalize(filters:Filters):Filters {
  const result:Filters={};
  for(const [key] of groups){const value=split(filters[key]).join(',');if(value)result[key]=value;}
  for(const key of ['date_from','date_to'] as const){const value=filters[key]?.trim();if(value)result[key]=value;}
  return result;
}
function validDate(value:string) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||value.startsWith('0000'))return false;
  const date=new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
}
export function filterError(filters:Filters,options?:Options) {
  if([filters.date_from,filters.date_to].some(v=>v&&!validDate(v)))return 'Ngày lọc không hợp lệ.';
  if(filters.date_from&&filters.date_to&&filters.date_from>filters.date_to)return 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.';
  if(options)for(const [key,label] of groups){if(split(filters[key]).some(v=>!options[key].includes(v)))return `${label}: có lựa chọn không còn trong phạm vi.`;}
  return null;
}
export function scopedOptions(response:OptionsResponse,scope:string|null):Options|undefined {
  const options=response.contacts;
  if(response.viewing_partner!==scope||!options||!groups.every(([key])=>Array.isArray(options[key])&&options[key].every(v=>typeof v==='string')))return undefined;
  return options;
}
export function marketingPath(kind:'summary'|'options',partner:string|null,filters:Filters={}) {
  const params=new URLSearchParams();if(partner)params.set('partner',partner);
  if(kind==='summary')for(const [key,value] of Object.entries(normalize(filters)))params.set(key,value);
  return (kind==='summary'?'/marketing/summary':'/meta/options')+(params.size?`?${params}`:'');
}
