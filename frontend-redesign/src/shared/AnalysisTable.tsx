import {tableCellValue} from './format';
import type { ReactNode, Key } from 'react';
import './data-workspace.css';
export type AnalysisColumn<Row>={key:string;label:string;heading?:ReactNode;render:(row:Row)=>ReactNode;numeric?:boolean};
/** Read-only analytical data; no fictitious sort or row action. */
export function AnalysisTable<Row>({label,rows,columns,empty,rowKey}:{label:string;rows:readonly Row[];columns:readonly AnalysisColumn<Row>[];empty:ReactNode;rowKey?:(row:Row,index:number)=>Key}) {
  return <div className="dw-table-scroll dw-analysis-scroll focus-ring" role="region" aria-label={label} tabIndex={0}>
    <table className="dw-table dw-analysis-table"><thead><tr>{columns.map(c=><th key={c.key} scope="col" data-align={c.numeric?'end':undefined}>{c.heading??c.label}</th>)}</tr></thead>
    <tbody>{rows.length?rows.map((r,i)=><tr key={rowKey?.(r,i)??i}>{columns.map((c,j)=>j===0?<th scope="row" key={c.key} data-align={c.numeric?'end':undefined}>{tableCellValue(c.render(r))}</th>:<td key={c.key} data-align={c.numeric?'end':undefined}>{tableCellValue(c.render(r))}</td>)}</tr>):<tr><td colSpan={columns.length}>{empty}</td></tr>}</tbody></table>
  </div>;
}
