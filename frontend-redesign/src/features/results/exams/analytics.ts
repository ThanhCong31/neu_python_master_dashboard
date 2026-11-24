import {countValid,finite,type HistogramRow,type GradeRow,type Round,type SectionRow} from './model.ts';
export const bins=Array.from({length:10},(_,i)=>i===9?'≥ 900':`${i*100}–<${(i+1)*100}`);
export function histogram(rows:HistogramRow[],total:number){const boards=[...new Set(rows.map(r=>r.board))];const sum=rows.reduce((n,r)=>n+r.count,0);const valid=countValid(total)&&rows.every(r=>countValid(r.count)&&Number.isInteger(r.bin)&&r.bin>=0&&r.bin<10)&&sum<=total;return {boards,sum,valid,values:(b:string|null)=>bins.map((_,i)=>rows.filter(r=>r.board===b&&r.bin===i).reduce((n,r)=>n+r.count,0))};}
export function gradeGroups(rows:GradeRow[],order:string[]){return [...new Set(rows.map(r=>r.board))].map(board=>{const group=rows.filter(r=>r.board===board);const total=group.reduce((n,r)=>n+r.count,0);const valid=group.every(r=>countValid(r.count));const grades=[...new Set([...order,...group.map(r=>r.grade)])].map(grade=>({grade,count:group.filter(r=>r.grade===grade).reduce((n,r)=>n+r.count,0)}));return {board,total,valid,grades};});}
export function sectionRatio(r:SectionRow){return finite(r.avg)&&finite(r.max_score)&&r.max_score>0&&r.avg>=0&&r.avg<=r.max_score&&finite(r.pct)&&r.pct>=0&&r.pct<=1&&Math.abs(r.pct-r.avg/r.max_score)<1e-6?r.pct:null;}

export const roundLabels: Record<Round, string> = {
  qualifier: 'Vòng loại',
  final: 'Chung kết',
};

const rounds: Round[] = ['qualifier', 'final'];

export function gradeRoundComparison(rows: GradeRow[], order: string[]) {
  const categories = [...new Set([...order, ...rows.map(row => row.grade)])];
  const groups = rounds.flatMap(round =>
    gradeGroups(rows.filter(row => row.round === round), categories).map(group => ({ ...group, round })),
  ).sort((a, b) => (a.board ?? '').localeCompare(b.board ?? '', 'vi') || rounds.indexOf(a.round) - rounds.indexOf(b.round));
  return { categories, groups };
}
