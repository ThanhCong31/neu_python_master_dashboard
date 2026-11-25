import {useState} from 'react';
import {Check,SlidersHorizontal} from 'lucide-react';
import {Button} from '@/components/expressive/button';
import {Checkbox} from '@/components/expressive/checkbox';
import {ResponsiveDialog} from '@/shared/ResponsiveDialog';
import {groups,type Filters,type Options} from '../model';
import {filterError,normalize,split} from '../query';

export function FilterBar({filters,options,onOpen,onReset}:{filters:Filters;options?:Options;onOpen:()=>void;onReset:()=>void}) {
  const count=Number(!!(filters.date_from||filters.date_to))+groups.filter(([key])=>!!filters[key]).length;
  return <div className="com-filter-actions"><Button motion="standard" variant="outlined" icon={<SlidersHorizontal/>} disabled={!options} onClick={onOpen}>Bộ lọc{count?` · ${count}`:''}</Button>{count>0&&<Button motion="standard" variant="text" onClick={onReset}>Xóa bộ lọc</Button>}</div>;
}
export function FilterDialog({filters,options,onClose,onApply}:{filters:Filters;options:Options;onClose:()=>void;onApply:(next:Filters)=>void}) {
  const [draft,setDraft]=useState(filters);
  const error=filterError(draft,options);
  return <ResponsiveDialog title="Bộ lọc truyền thông" onClose={onClose} footer={<>
    <Button motion="standard" variant="text" onClick={()=>setDraft({})}>Đặt lại</Button><span className="flex-1" aria-hidden="true"/>
    <Button motion="standard" variant="outlined" onClick={onClose}>Hủy</Button>
    <Button motion="standard" icon={<Check/>} disabled={!!error} onClick={()=>onApply(normalize(draft))}>Áp dụng</Button>
  </>}>
    <section className="com-filter-section"><h3>Ngày tiếp xúc đầu tiên</h3><p className="dw-note">Không phải ngày đăng ký web. Có thể chỉ chọn một đầu khoảng ngày.</p>
      <div className="com-date-grid"><label>Từ ngày<input type="date" value={draft.date_from??''} onChange={e=>setDraft(f=>({...f,date_from:e.target.value}))}/></label><label>Đến ngày<input type="date" value={draft.date_to??''} onChange={e=>setDraft(f=>({...f,date_to:e.target.value}))}/></label></div>
    </section>
    <div className="com-filter-dimensions">{groups.map(([key,label])=>{
      const selected=split(draft[key]);const available=options[key];const choices=[...new Set([...selected,...available])];
      return <fieldset className="com-choices" key={key}><legend>{label}</legend>{choices.length?choices.map(choice=>{
        const checked=selected.includes(choice);const missing=!available.includes(choice);
        return <Checkbox key={choice} checked={checked} disabled={!checked&&choice.includes(',')} onChange={()=>setDraft(f=>({...f,[key]:(checked?selected.filter(v=>v!==choice):[...selected,choice]).sort().join(',')}))}>{choice}{missing?' (không còn khả dụng)':choice.includes(',')?' (API không hỗ trợ dấu phẩy)':''}</Checkbox>;
      }):<p className="dw-note">Không có lựa chọn.</p>}</fieldset>;
    })}</div>
    {error&&<p className="dw-error" role="alert">{error}</p>}
  </ResponsiveDialog>;
}
