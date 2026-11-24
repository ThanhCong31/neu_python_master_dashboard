import assert from 'node:assert/strict';
import {scopedOptions,scoreText,certificateText,finalText,layoutForWidth} from '../src/features/results/exams/model.ts';
import {resolveDataset,selectDataset,parseFilters,writeFilters,makePath,filterError,validSort,exactGroupFilter,pageCount,csvFilename} from '../src/features/results/exams/query.ts';
import {bins,histogram,gradeGroups,gradeRoundComparison,sectionRatio} from '../src/features/results/exams/analytics.ts';
const a={code:'A24',label:'Bảng A',linked:false},b={code:'B95',label:'Bảng B',linked:false},p={code:'PM119',label:'CRM',linked:true};const options={datasets:[a,b],board:['Bảng A'],region:['Miền Bắc'],province:['Hà Nội'],school_type:['THPT'],school:['Trường A','A,B'],grade:['Giỏi','Khá']};
assert.equal(resolveDataset([a,p],null),p);assert.equal(resolveDataset([a,b],null),a);assert.equal(resolveDataset([a,b],'PM119'),a);assert.equal(resolveDataset([a,b],'B95'),b);assert.equal(resolveDataset([],null),undefined);assert.equal(scopedOptions({viewing_partner:'A',exams:options},'B'),undefined);assert.equal(scopedOptions({viewing_partner:'A',exams:options},'A'),options);assert.equal(scopedOptions({viewing_partner:null},null),undefined);
const f={board:'Bảng A',paid:'false',certificate:'true',advanced:'false'};const url=writeFilters(new URLSearchParams('dataset=A24&view=analysis&partner=OTHER&q=secret'),f);assert.deepEqual(parseFilters(url),f);assert.equal(url.get('dataset'),'A24');assert.equal(url.get('partner'),null);assert.equal(url.get('q'),null);assert.deepEqual([...selectDataset(url,'B95').entries()],[['dataset','B95'],['view','analysis']]);assert.equal(filterError(f,options),null);assert.ok(filterError({paid:'0'},options));assert.ok(filterError({school:'A,B'},options));assert.ok(filterError({grade:'Yếu'},options));
const params=x=>new URL(x,'http://localhost').searchParams;const list=params(makePath('list','NH','A24',f,'  Nguyễn +.*  ',2,20,'final.rank'));const csv=params(makePath('csv','NH','A24',f,'  Nguyễn +.*  '));for(const k of ['dataset','partner','board','paid','certificate','advanced','q'])assert.equal(list.get(k),csv.get(k));assert.equal(list.get('sort'),'-qualifier.total');assert.equal(csv.get('sort'),null);assert.equal(csv.get('page'),null);assert.equal(csv.get('format'),'csv');assert.equal(params(makePath('summary',null,'A24',f,'secret')).get('q'),null);assert.equal(params(makePath('options',null,'A24',f)).get('board'),null);assert.equal(validSort('final.total'),'final.total');assert.equal(pageCount(0,20),1);assert.equal(pageCount(21,20),2);assert.deepEqual(exactGroupFilter('by_school','Trường A',options,{}),{school:'Trường A'});assert.equal(exactGroupFilter('by_school','A,B',options,{}),null);assert.equal(exactGroupFilter('by_school',null,options,{}),null);assert.equal(exactGroupFilter('by_board','Bảng A',options,{board:'Bảng B'}),null);assert.equal(csvFilename('A24'),'diem_thi_A24_gia-lap.csv');
assert.equal(scoreText(null),'—');assert.equal(scoreText(0),'0');assert.equal(scoreText(599.9),'599,9');assert.equal(certificateText(true),'Đạt ngưỡng');assert.equal(certificateText(null),'Chưa có dữ liệu');assert.match(finalText({advanced:true,final:null}),/Chưa có điểm/);assert.match(finalText({advanced:false,final:{total:650}}),/không khớp/);
const h=histogram([{board:'Bảng A',bin:0,count:1},{board:'Bảng A',bin:9,count:2}],5);assert.equal(h.sum,3);assert.equal(h.valid,true);assert.deepEqual(h.values('Bảng A'),[1,0,0,0,0,0,0,0,0,2]);assert.equal(bins[9],'≥ 900');assert.equal(histogram([{board:'A',bin:-1,count:1}],5).valid,false);assert.equal(histogram([{board:'A',bin:1,count:6}],5).valid,false);const g=gradeGroups([{board:'A',round:'qualifier',grade:'Giỏi',count:3},{board:'A',round:'qualifier',grade:'Khác',count:1}],['Giỏi','Khá'])[0];assert.equal(g.total,4);assert.equal(g.grades.at(-1).grade,'Khác');assert.equal(sectionRatio({avg:50,max_score:100,pct:.5}),.5);assert.equal(sectionRatio({avg:0,max_score:100,pct:0}),0);assert.equal(sectionRatio({avg:50,max_score:null,pct:.5}),null);assert.equal(sectionRatio({avg:50,max_score:100,pct:.8}),null);assert.deepEqual([320,679,680,999,1000,1440].map(layoutForWidth),['compact','compact','medium','medium','expanded','expanded']);
console.log('PASS: scoped dataset resolution, filter and CSV paths, allowlisted sorts, drilldown, null/zero and fractional scores, histogram coverage, grades, section denominators, layout tiers.');

// The all-round view needs a separate denominator for every board and round.
const compared = gradeRoundComparison([
  { board: 'Bảng B', round: 'qualifier', grade: 'Khá', count: 6 },
  { board: 'Bảng A', round: 'final', grade: 'Khác', count: 1 },
  { board: 'Bảng A', round: 'qualifier', grade: 'Giỏi', count: 8 },
  { board: 'Bảng A', round: 'qualifier', grade: 'Khá', count: 12 },
], ['Giỏi', 'Khá']);
assert.deepEqual(compared.categories, ['Giỏi', 'Khá', 'Khác']);
assert.deepEqual(compared.groups.map(({ board, round, total }) => [board, round, total]), [
  ['Bảng A', 'qualifier', 20],
  ['Bảng A', 'final', 1],
  ['Bảng B', 'qualifier', 6],
]);
assert.deepEqual(compared.groups.map(group => group.grades.map(grade => grade.count)), [[8, 12, 0], [0, 0, 1], [0, 6, 0]]);
assert.equal(gradeRoundComparison([{ board: 'Bảng A', round: 'final', grade: 'Khá', count: -1 }], []).groups[0].valid, false);
assert.deepEqual(gradeRoundComparison([], ['Giỏi']).groups, []);
console.log('PASS: round comparison preserves cohort denominators, missing rounds and unknown grades.');

// V33: grade charts share board roles regardless of the order or filtering.
const {boardColor,gradeChartable,gradeChartOption}=await import('../src/shared/charts/grade-distribution.ts');
const {chartLayoutForWidth}=await import('../src/shared/charts/responsive.ts');
for(const p of [{primary:'#405F90',tertiary:'#715574',secondary:'#535d73',onSecondaryContainer:'#33445d',outline:'#737783',muted:'#555966',text:'#20242b',grid:'#c5c7d1'},{primary:'#a9c7ff',tertiary:'#e7b8e0',secondary:'#bbc6df',onSecondaryContainer:'#d7e1f5',outline:'#a1a5b0',muted:'#c4c6d0',text:'#f1f2f6',grid:'#454954'}]){
  assert.equal(boardColor('Bảng A',p,1),p.primary);
  assert.equal(boardColor('Bảng B',p,0),p.tertiary);
  const categories=['Giỏi','Khá','Trung bình','Yếu'];
  const rows=[{board:'Bảng A',counts:[0,2,10,12]},{board:'Bảng B',counts:[4,20,33,38]}];
  assert.equal(gradeChartable(categories,rows),true);
  assert.equal(gradeChartable(categories,[{board:'Bảng A',counts:[-1,2,0,0]}]),false);
  assert.equal(gradeChartable(categories,[{board:'Bảng A',counts:[1]}]),false);
  for(const width of [240,339,480,680,1000,1440]){
    const option=gradeChartOption(p,chartLayoutForWidth(width),categories,rows);
    assert.equal(option.aria.decal.show,false);
    assert.equal(option.aria.enabled,true);
    assert.deepEqual(option.series.map(s=>s.data),rows.map(r=>r.counts));
    assert.deepEqual(option.series.map(s=>s.itemStyle.color),[p.primary,p.tertiary]);
    const single=gradeChartOption(p,chartLayoutForWidth(width),categories,[rows[1]]);
    assert.equal(single.series[0].itemStyle.color,p.tertiary);
  }
}
console.log('PASS: solid grade bars, Material theme roles, stable board colors, count validation and responsive chart options.');
