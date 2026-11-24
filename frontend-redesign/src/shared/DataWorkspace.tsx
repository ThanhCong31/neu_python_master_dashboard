import type { ReactNode, Key } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from '@/components/expressive/icon-button';
import { WorkspaceSelect } from './WorkspaceSelect';
import { numberText } from './format';
import './data-workspace.css';

export type RecordColumn<Row>={key:string;label:string;sort?:string;align?:'start'|'center'|'end';render:(row:Row)=>ReactNode};
/** Presentation only: caller owns request, allowed sorts, identity and visible columns. */
export function RecordTable<Row>({rows,columns,rowKey,sort,onSort,action,label,className='',containerClassName=''}:{
  rows:Row[];columns:RecordColumn<Row>[];rowKey:(row:Row,index:number)=>Key;sort:string;onSort:(sort:string)=>void;
  action:(row:Row)=>ReactNode;label:string;className?:string;containerClassName?:string;
}) {
  return <div className={`dw-table-scroll focus-ring ${containerClassName}`} tabIndex={0} role="region" aria-label={label}>
    <table className={`dw-table ${className}`}><thead><tr>{columns.map(c=>{
      const direction=c.sort&&sort===c.sort?'ascending':c.sort&&sort===`-${c.sort}`?'descending':undefined;
      return <th key={c.key} scope="col" data-align={c.align} aria-sort={direction}>{c.sort?<button type="button" className="dw-sort-header focus-ring" onClick={()=>onSort(direction==='ascending'?`-${c.sort}`:c.sort!)}>{c.label}<span className="dw-sort-icon" aria-hidden="true">{direction==='descending'?<ArrowDown size={15}/>:<ArrowUp size={15} style={{visibility:direction?'visible':'hidden'}}/>}</span></button>:c.label}</th>;
    })}<th scope="col"><span className="dw-sr">Chi tiết</span></th></tr></thead>
    <tbody>{rows.map((r,i)=><tr key={rowKey(r,i)}>{columns.map(c=><td key={c.key} data-align={c.align}>{c.render(r)}</td>)}<td>{action(r)}</td></tr>)}</tbody></table>
  </div>;
}
export function RecordList<Row>({rows,rowKey,render,action}:{rows:Row[];rowKey:(row:Row,index:number)=>Key;render:(row:Row)=>ReactNode;action:(row:Row)=>ReactNode}) {
  return <ul className="dw-record-list">{rows.map((r,i)=><li key={rowKey(r,i)}><div className="dw-list-content">{render(r)}</div>{action(r)}</li>)}</ul>;
}
const sizes=[10,20,50,100].map(n=>({value:String(n),label:String(n)}));
export function WorkspacePagination({page,pages,size,total,unit,pending,onPage,onSize}:{page:number;pages:number;size:number;total:number;unit:string;pending:boolean;onPage:(page:number)=>void;onSize:(size:number)=>void}) {
  const range=total?`${numberText((page-1)*size+1)}–${numberText(Math.min(page*size,total))}`:'0';
  return <div className="dw-pager"><span>{range} / {numberText(total)} {unit}</span><WorkspaceSelect label="Số dòng" value={String(size)} options={sizes} onChange={v=>onSize(Number(v))}/>
    <nav className="dw-page-nav" aria-label="Phân trang"><IconButton motion="standard" variant="standard" aria-label="Trang trước" disabled={page<=1||pending} onClick={()=>onPage(page-1)}><ChevronLeft aria-hidden="true"/></IconButton><span aria-current="page">{page} / {pages}</span><IconButton motion="standard" variant="standard" aria-label="Trang sau" disabled={page>=pages||pending} onClick={()=>onPage(page+1)}><ChevronRight aria-hidden="true"/></IconButton></nav>
  </div>;
}
