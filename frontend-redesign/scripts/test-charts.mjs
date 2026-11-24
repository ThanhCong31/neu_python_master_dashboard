import assert from 'node:assert/strict';
import {styleSeries,barValue,styleAxis,isCategoryAxis,groupLabelWidth,chartTickBudget,sourceRole,resultRole} from '../src/shared/charts/chart-style.ts';
import {chartLayoutForWidth,categoryTickIndices} from '../src/shared/charts/responsive.ts';
const input=[{name:'a',type:'bar',stack:'count',data:[5,4,0,2,null],itemStyle:{color:'blue'}},{name:'b',type:'bar',stack:'count',data:[3,0,7,0,null],itemStyle:{color:'purple'}},{name:'c',type:'bar',stack:'count',data:[0,0,1,2,null],itemStyle:{color:'gray'}}];
const before=structuredClone(input);
for(const horizontal of [false,true]){
 const radius=horizontal?[0,4,4,0]:[4,4,0,0];
 for(let mask=1;mask<8;mask++){
  const visible=input.filter((_,i)=>mask&(1<<i));const out=styleSeries(visible,horizontal);
  assert.deepEqual(out.map(s=>s.data.map(barValue)),visible.map(s=>s.data));
  for(let j=0;j<5;j++){
   const last=visible.findLastIndex(s=>(s.data[j]??0)>0);
   for(let i=0;i<out.length;i++)if(out[i].data[j]!==null)assert.deepEqual(out[i].data[j].itemStyle.borderRadius,i===last?radius:0);
  }
 }
 const grouped=styleSeries([{type:'bar',data:[1,0,null],itemStyle:{color:'red'}}],horizontal)[0];assert.deepEqual(grouped.itemStyle.borderRadius,radius);assert.deepEqual(grouped.data,[1,0,null]);
}
assert.deepEqual(input,before);
const unsupported={type:'bar',data:[-1,2]};assert.equal(styleSeries([unsupported],false)[0],unsupported);
const objectDatum={type:'bar',stack:'a',data:[{value:2,name:'sample',itemStyle:{color:'red'}}]};const styled=styleSeries([objectDatum],false)[0];assert.equal(styled.data[0].name,'sample');assert.equal(styled.data[0].itemStyle.color,'red');
assert.equal(styleSeries([{type:'line',data:[1,2],lineStyle:{color:'red'}}],false)[0].lineStyle.width,3);
assert.equal(sourceRole('FB Lead Form',0),sourceRole('FB Lead Form',3));assert.equal(sourceRole('Talkshow',0),sourceRole('Talkshow Google Form',2));assert.notEqual(sourceRole('FB Lead Form'),sourceRole('Talkshow'));assert.equal(resultRole('Đã có trong Data'),'tertiary');assert.notEqual(resultRole('Lead mới'),resultRole('Trùng trong form ngoài'));
for(const width of [200,240,319,339,340,479,480,679,680,999,1000,1440,1920]){
 const l=chartLayoutForWidth(width);assert.ok(groupLabelWidth(l)<width*.5);const ticks=categoryTickIndices(365,chartTickBudget(l,8));assert.ok(ticks.has(0)&&ticks.has(364));assert.ok(ticks.size<=l.tickBudget);
 const formatter=v=>String(v);const axis=styleAxis({type:'value',axisLabel:{formatter},splitLine:{lineStyle:{opacity:1}}},l,{muted:'#555',grid:'#ccc'});assert.equal(axis.axisLabel.formatter,formatter);assert.equal(axis.splitLine.lineStyle.opacity,.55);assert.equal(axis.axisLabel.fontSize,l.compact?11:12);
}
// Regression: EChartsCoreOption axis fields are unknown, including optional and array forms.
const layout=chartLayoutForWidth(320), colors={muted:'#555',grid:'#ccc'};
for(const value of [undefined,null,false,0,'value']){
 assert.equal(styleAxis(value,layout,colors),value);
 assert.equal(isCategoryAxis(value),false);
}
assert.equal(isCategoryAxis({type:'category'}),true);
assert.equal(isCategoryAxis({type:'value'}),false);
assert.equal(isCategoryAxis([{type:'category'},{type:'value'}]),true);
assert.equal(isCategoryAxis([]),false);
const axes=[{type:'category',data:['A','B']},{type:'value',min:0}];
const copy=structuredClone(axes);
const styledAxes=styleAxis(axes,layout,colors);
assert.deepEqual(styledAxes[0].data,['A','B']);
assert.equal(styledAxes[1].min,0);
assert.equal(styledAxes[1].axisLabel.color,colors.muted);
assert.deepEqual(axes,copy);
console.log('PASS: unknown axis values, optional axes, and array axis handling.');
console.log('PASS: bar caps for horizontal/vertical stacks, all 7 legend visibility masks, zeros/nulls, data preservation, stable theme roles, responsive axes and tick budgets.');
