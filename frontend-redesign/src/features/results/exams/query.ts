import {multiFields,boolFields,dimensions,type Dataset,type Filters,type ExamOptions,type Dimension,type FilterKey} from './model.ts';
export const filterKeys:FilterKey[]=[...multiFields.map(([k])=>k),...boolFields.map(([k])=>k)];
export const sortFields=[['qualifier.total','Điểm VL'],['qualifier.rank','Hạng VL'],['final.total','Điểm CK'],['full_name','Họ tên'],['school','Trường'],['province','Tỉnh/thành'],['stt','STT'],['best_total','Điểm cao nhất']] as const;
export const split=(v?:string)=>[...new Set((v??'').split(',').map(x=>x.trim()).filter(Boolean))].sort();
export function normalize(f:Filters){const out:Filters={};for(const [k] of multiFields){const v=split(f[k]).join(',');if(v)out[k]=v;}for(const [k] of boolFields)if(f[k])out[k]=f[k];return out;}
export function parseFilters(p:URLSearchParams){const f:Filters={};for(const k of filterKeys){const v=p.get(k);if(v)f[k]=v;}return normalize(f);}
export function writeFilters(p:URLSearchParams,f:Filters){const n=new URLSearchParams(p);for(const k of [...filterKeys,'q','partner'])n.delete(k);for(const [k,v] of Object.entries(normalize(f)))n.set(k,v);return n;}
export function selectDataset(p:URLSearchParams,code:string){const n=writeFilters(p,{});n.set('dataset',code);return n;}
export function resolveDataset(ds:Dataset[],requested:string|null){return ds.find(d=>d.code===requested)??ds.find(d=>d.code==='PM119')??ds[0];}
export function filterError(f:Filters,o?:ExamOptions){for(const [k,label] of boolFields)if(f[k]&&f[k]!=='true'&&f[k]!=='false')return `${label}: giá trị không hợp lệ.`;if(o)for(const [k,label] of multiFields)if(split(f[k]).some(v=>!o[k].includes(v)))return `${label}: lựa chọn không còn trong phạm vi.`;return null;}
export const searchValue=(s:string)=>s.trim().slice(0,80);
export const validSort=(s:string)=>sortFields.some(([k])=>s===k||s===`-${k}`)?s:'-qualifier.total';
export const pageCount=(total:number,size:number)=>Math.max(1,Math.ceil(total/size));
export function makePath(kind:'options'|'list'|'csv'|'summary',partner:string|null,dataset:string,filters:Filters={},q='',page=1,size=20,sort='-qualifier.total'){
 const p=new URLSearchParams({dataset});if(partner)p.set('partner',partner);if(kind!=='options')for(const [k,v] of Object.entries(normalize(filters)))p.set(k,v);if((kind==='list'||kind==='csv')&&searchValue(q))p.set('q',searchValue(q));if(kind==='list'){p.set('page',String(page));p.set('page_size',String(size));p.set('sort',validSort(sort));}if(kind==='csv')p.set('format','csv');return `${kind==='options'?'/meta/options':kind==='summary'?'/exams/summary':'/exams/list'}?${p}`;
}
export function exactGroupFilter(dim:Dimension,v:string|null,o:ExamOptions,f:Filters):Filters|null {const k=dimensions.find(d=>d[0]===dim)?.[2];if(!k||!v||v.includes(',')||!o[k].includes(v))return null;const selected=split(f[k]);return !selected.length||selected.includes(v)?{[k]:v}:null;}
export const csvFilename=(code:string)=>`diem_thi_${code.replace(/[^a-zA-Z0-9_-]/g,'_')}_gia-lap.csv`;
