import assert from 'node:assert/strict';
import { evaluateTypescript } from './test-loader.mjs';
import { overviewPath, reportPath, reportMimeValid, ratio, validFunnel, visibleDomains, gradeRows } from '../src/features/overview/model.ts';
import { numberText, moneyText, compactMoney, percentText, dateText } from '../src/shared/format.ts';
const crm={kpi:{total:100,web_registered:80,paid:50},funnel:[],timeline:[]};
const data={modules:['overview','contacts','exams','marketing','sponsorship'],viewing_partner:null,crm,exams:{},marketing:{},sponsorship:{}};
assert.deepEqual(visibleDomains(data,['overview','contacts','exams','marketing','sponsorship']),['crm','exams','sponsorship','marketing']);
assert.deepEqual(visibleDomains(data,['overview','exams','sponsorship']),['exams','sponsorship']);
assert.deepEqual(visibleDomains({...data,modules:['overview','sponsorship']},data.modules),['sponsorship']);
assert.deepEqual(visibleDomains({...data,exams:undefined},['overview','exams']),[]);
assert.equal(overviewPath(null),'/overview');
assert.equal(overviewPath('A & B'),'/overview?partner=A+%26+B');
assert.equal(reportPath('xlsx','NEU'),'/overview/export?format=xlsx&partner=NEU');
assert.equal(reportPath('pdf',null),'/overview/export?format=pdf');
assert.equal(reportMimeValid('pdf','application/pdf'),true);
assert.equal(reportMimeValid('pdf','text/html'),false);
assert.equal(reportMimeValid('xlsx','application/octet-stream'),true);
assert.equal(validFunnel(crm.kpi),true);
assert.equal(validFunnel({total:100,web_registered:110,paid:50}),false);
assert.equal(validFunnel({total:0,web_registered:0,paid:0}),true);
assert.equal(validFunnel({total:100,web_registered:80,paid:-1}),false);
assert.equal(ratio(0,0),null);assert.equal(ratio(0,10),0);assert.equal(ratio(50,80),0.625);
assert.deepEqual(gradeRows([{board:'Bảng A',grade:'Giỏi',count:3},{board:'Bảng A',grade:'Giỏi',count:2},{board:'Bảng A',grade:null,count:1},{board:'Bảng A',grade:'Unknown',count:4}]),[{board:'Bảng A',counts:[5,0,0,0,5]}]);
assert.equal(numberText(null),'—');assert.equal(numberText(0),'0');assert.equal(percentText(0.125),'12,5%');assert.equal(percentText(null),'—');assert.equal(compactMoney(1500000),'1,5 triệu ₫');assert.equal(moneyText(500000),'500.000 ₫');assert.equal(dateText('2026-08-01'),'01/08/2026');
console.log('PASS: overview assertions (scope/module, report URL/MIME, funnel, grade grouping, formatters).');

// Simulate resolved CSS roles and the same event / root-class changes used by V9.
// These are fixture colors, not a substitute for rendering all generated palettes.
const fixtures = {
  campus: { primary:'#405F90', 'on-secondary-container':'#3B475C', tertiary:'#715574' },
  ember: { primary:'#9B4334', 'on-secondary-container':'#5D3F3A', tertiary:'#805819' },
  dark: { primary:'#FFB4A6', 'on-secondary-container':'#F5DAD4', tertiary:'#F4BE78' },
};
let roles = fixtures.campus;
let palette, cleanup, observerUpdate, disconnected = false;
const listeners = new Map();
const theme = evaluateTypescript(new URL('../src/shared/charts/theme.ts', import.meta.url), {
  context: {
    exports: {}, document:{documentElement:{}},
    getComputedStyle:()=>({getPropertyValue:name=>roles[name.replace('--ex-color-','')]??'#777777'}),
    window:{addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)},
    MutationObserver:class { constructor(fn){observerUpdate=fn;} observe(){} disconnect(){disconnected=true;} },
  },
  imports: {react:{useState:init=>{palette=init();return [palette,next=>{palette=next;}];},useEffect:fn=>{cleanup=fn();}}},
  exports:['useChartPalette'],
});
theme.useChartPalette();
const seriesColors=()=>[palette.onSecondaryContainer,palette.primary,palette.tertiary];
const expected=fixture=>[fixture['on-secondary-container'],fixture.primary,fixture.tertiary];
assert.deepEqual(seriesColors(),expected(fixtures.campus));
roles=fixtures.ember;
listeners.get('neu-theme-change')();
assert.deepEqual(seriesColors(),expected(fixtures.ember));
roles=fixtures.dark;
observerUpdate();
assert.deepEqual(seriesColors(),expected(fixtures.dark));
cleanup();
assert.equal(listeners.has('neu-theme-change'),false);
assert.equal(disconnected,true);
console.log('PASS: chart palette reads Material roles, updates on palette and appearance changes, and cleans up listeners.');

// V16: responsive decisions must follow the actual plot width, not viewport width.
const {chartLayoutForWidth,categoryTickIndices,shortChartDate}=await import('../src/shared/charts/responsive.ts');
for(const [width,tier,budget] of [[240,'narrow',3],[339,'narrow',3],[340,'compact',4],[479,'compact',4],[480,'medium',5],[679,'medium',5],[680,'wide',7],[999,'wide',7],[1000,'large',9]]) {
  const layout=chartLayoutForWidth(width);
  assert.equal(layout.tier,tier);
  assert.equal(layout.tickBudget,budget);
  assert.equal(layout.compact,width<480);
}
assert.deepEqual([...categoryTickIndices(0,3)],[]);
assert.deepEqual([...categoryTickIndices(1,3)],[0]);
assert.deepEqual([...categoryTickIndices(2,3)],[0,1]);
for(const count of [3,4,7,31,365]) for(const budget of [3,4,5,7,9]) {
  const ticks=[...categoryTickIndices(count,budget)];
  assert.equal(ticks[0],0);assert.equal(ticks.at(-1),count-1);
  assert.equal(ticks.length,Math.min(count,budget));
  assert.ok(ticks.every((v,i)=>i===0||v>ticks[i-1]));
}
assert.equal(shortChartDate('01/08/2026',false),'01/08');
assert.equal(shortChartDate('01/08/2026',true),'01/08/26');
assert.equal(shortChartDate('unknown',false),'unknown');
console.log('PASS: responsive chart breakpoints, bounded tick selection and date labels.');
