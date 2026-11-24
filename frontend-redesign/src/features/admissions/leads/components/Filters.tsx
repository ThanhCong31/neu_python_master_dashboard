import { Checkbox } from '@/components/expressive/checkbox';
import { InputChip } from '@/components/expressive/chip';
import {useState} from 'react';
import {Check,SlidersHorizontal} from 'lucide-react';
import {Button} from '@/components/expressive/button';
import {TextField} from '@/components/expressive/text-field';
import {dateText} from '@/shared/format';
import {groups,optionsFor,type LeadOptions,type Filters,type GroupKey,type Option} from '../model';
import {filterError,normalize,split} from '../query';
import {Dialog} from './Dialog';
function ChoiceGroup({label,options,value,onChange}:{label:string;options:Option[];value?:string;onChange:(v:string)=>void}) {
  const [search,setSearch]=useState('');const selected=split(value);
  const missing=selected.filter(v=>!options.some(o=>o.value===v)).map(v=>({value:v,label:`${v} (không còn khả dụng)`}));
  const visible=[...missing,...options].filter(o=>o.label.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')));
  return <fieldset className="ld-choices"><legend>{label}{selected.length?` · ${selected.length}`:''}</legend>{options.length>8&&<TextField label={`Tìm ${label.toLocaleLowerCase('vi')}`} variant="search" value={search} onChange={e=>setSearch(e.target.value)}/>}
    <div className="ld-choice-list">{visible.map(o=><Checkbox key={o.value} checked={selected.includes(o.value)} disabled={!selected.includes(o.value)&&o.value.includes(',')} onChange={()=>onChange((selected.includes(o.value)?selected.filter(v=>v!==o.value):[...selected,o.value]).sort().join(','))}>{o.label}{o.value.includes(',')?' (API không hỗ trợ dấu phẩy)':''}</Checkbox>)}{!visible.length&&<p className="ld-note">Không có lựa chọn.</p>}</div>
  </fieldset>;
}
export function FilterDialog({filters,options,onApply,onClose}:{filters:Filters;options:LeadOptions;onApply:(f:Filters)=>void;onClose:()=>void}) {
  const [draft,setDraft]=useState(filters);const error=filterError(draft,options);const set=(k:keyof Filters,v:string)=>setDraft(f=>({...f,[k]:v}));
  const sections:{label:string;keys:GroupKey[]}[]=[{label:'Nguồn và đối soát',keys:['source','result','campaign','platform']},{label:'Quan tâm',keys:['board','region','segment']},{label:'Vận hành',keys:['pic']}];
  return <Dialog title="Bộ lọc lead" onClose={onClose} footer={<><Button motion="standard" variant="text" onClick={()=>setDraft({})}>Đặt lại</Button><span className="ld-spacer"/><Button motion="standard" variant="outlined" onClick={onClose}>Hủy</Button><Button motion="standard" disabled={!!error} icon={<Check/>} onClick={()=>onApply(normalize(draft))}>Áp dụng</Button></>}>
    <p className="ld-note">Chọn nhiều giá trị trong một nhóm. Các nhóm được kết hợp đồng thời.</p>
    <section className="ld-filter-section"><h3>Ngày gửi biểu mẫu</h3><p className="ld-note">Theo ngày gửi ghi nhận trong dữ liệu. Có thể chỉ chọn một đầu khoảng ngày.</p>
      <div className="ld-date-grid"><label>Từ ngày<input type="date" value={draft.date_from??''} onChange={e=>set('date_from',e.target.value)}/></label><label>Đến ngày<input type="date" value={draft.date_to??''} onChange={e=>set('date_to',e.target.value)}/></label></div></section>
    {sections.map(s=><section className="ld-filter-section" key={s.label}><h3>{s.label}</h3>{s.keys.map(k=><ChoiceGroup key={k} label={groups.find(([key])=>key===k)![1]} options={optionsFor(options,k)} value={draft[k]} onChange={v=>set(k,v)}/>)}</section>)}
    {error&&<p role="alert" className="ld-error">{error}</p>}
  </Dialog>;
}
export function FilterBar({filters,options,onChange,onOpen}:{filters:Filters;options?:LeadOptions;onChange:(f:Filters)=>void;onOpen:()=>void}) {
  const chips:{label:string;detail:string;keys:(keyof Filters)[]}[]=[];
  if(filters.date_from||filters.date_to){const label=`${filters.date_from?dateText(filters.date_from):'Đầu kỳ'} – ${filters.date_to?dateText(filters.date_to):'Cuối kỳ'}`;chips.push({label,detail:`Ngày gửi biểu mẫu: ${label}`,keys:['date_from','date_to']});}
  for(const [k,label] of groups){const values=split(filters[k]);if(!values.length)continue;const names=values.map(v=>options&&optionsFor(options,k).find(o=>o.value===v)?.label||v);chips.push({label:values.length>1?`${label} · ${values.length}`:names[0],detail:`${label}: ${names.join(', ')}`,keys:[k]});}
  return <div className="ld-filters"><div className="ld-filter-actions"><Button motion="standard" variant="outlined" icon={<SlidersHorizontal/>} disabled={!options} onClick={onOpen}>Bộ lọc{chips.length?` · ${chips.length}`:''}</Button></div>{chips.length>0&&<div className="ld-filter-chips">{chips.map(c=><InputChip key={c.keys.join(',')} label={c.label} removeLabel={`Xóa lọc ${c.detail}`} title={c.detail} onRemove={()=>{const next={...filters};for(const k of c.keys)delete next[k];onChange(next);}}/>)}{chips.length>0&&<Button motion="standard" variant="text" onClick={()=>onChange({})}>Xóa lọc</Button>}</div>}</div>;
}
