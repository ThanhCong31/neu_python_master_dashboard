import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {exactGroupFilter} from '../src/features/admissions/contacts/query.ts';
import {dimensions,validHeatmapCell,registrationPattern} from '../src/features/admissions/contacts/model.ts';
import {numberText,moneyText,percentText,percentagePointsText} from '../src/shared/format.ts';
import {budgeted,reconciliationRows,conversionValid} from '../src/features/communications/marketing/model.ts';
import {filterError,marketingPath,normalize,scopedOptions} from '../src/features/communications/marketing/query.ts';
import {benefitStatus,metrics,progress} from '../src/features/communications/sponsorship/model.ts';
import {sponsorshipPath} from '../src/features/communications/sponsorship/query.ts';
const read = path => readFileSync(new URL('../src/'+path,import.meta.url),'utf8');
const venue={venue:['A','A,B']};
assert.ok(dimensions.some(([key])=>key==='by_drip'));
assert.ok(dimensions.some(([key])=>key==='by_venue'));
assert.deepEqual(exactGroupFilter('by_venue','A',venue),{key:'venue',value:'A'});
for(const key of ['B',null,'A,B'])assert.equal(exactGroupFilter('by_venue',key,venue),null);
assert.equal(exactGroupFilter('by_drip','A',venue),null);
for(const row of [{dow:1,hour:0,count:0},{dow:7,hour:23,count:100}])assert.ok(validHeatmapCell(row));
for(const row of [{dow:0,hour:0,count:1},{dow:8,hour:23,count:1},{dow:1,hour:24,count:1},{dow:1,hour:-1,count:1},{dow:1,hour:1,count:-1},{dow:1,hour:1,count:.5}])assert.ok(!validHeatmapCell(row));
const midnight=registrationPattern([{dow:1,hour:0,count:13},{dow:3,hour:0,count:30},{dow:1,hour:12,count:0},{dow:1,hour:0,count:2}]);
assert.equal(midnight.singleHour,true);assert.equal(midnight.total,45);assert.deepEqual(midnight.weekdays,[15,0,30,0,0,0,0]);
assert.equal(registrationPattern([{dow:1,hour:0,count:1},{dow:1,hour:12,count:1}]).singleHour,false);
assert.equal(registrationPattern([]).total,0);assert.equal(registrationPattern([]).singleHour,false);
assert.equal(registrationPattern([{dow:0,hour:0,count:1}]).valid,false);
assert.equal(registrationPattern([{dow:1,hour:0,count:Number.MAX_SAFE_INTEGER},{dow:2,hour:0,count:1}]).valid,false);
assert.equal(numberText(null),'—');assert.notEqual(numberText(0),'—');assert.equal(moneyText(null),'—');assert.equal(percentText(0),'0%');assert.equal(percentText(null),'—');
// Source guards supplement, not replace, runtime UI tests.
const upload=read('features/system/admin/Data.tsx');
assert.ok(!upload.includes('MAX_BYTES'));
assert.ok(upload.includes('Diểm giả lập.xlsx'));
assert.ok(upload.includes('file.size===0'));
assert.ok(upload.includes('THAY THE'));
const leads=read('features/admissions/leads/components/Analytics.tsx');
assert.match(leads, /value\s*:\s*['"]by_question['"]/);
assert.match(leads, /!canViewPii\s*&&\s*selection\s*===\s*['"]by_question['"]/);
assert.doesNotMatch(leads, /canViewPii\s*&&\s*<section\b/);
assert.ok(read('features/admissions/leads/components/Records.tsx').includes('c.key!=="question"||canViewPii'));
const exams=read('features/results/exams/components/Analytics.tsx');
for(const field of ['data.by_paid','data.final_by_board','data.finalists','sectionTable','r.box?.[2]'])assert.ok(exams.includes(field),field);
for(const pattern of [/type\s*:\s*['"]boxplot['"]/, /type\s*:\s*['"]scatter['"]/, /textValue\(r\.full_name\)/, /textValue\(r\.school\)/]) assert.match(exams,pattern);
// V67: module/scope authorize Exams; the backend masks fields. No PII gate on exports or presentation.
const examRecords=read('features/results/exams/components/Records.tsx');
const examDetail=read('features/results/exams/components/Detail.tsx');
assert.match(examRecords, /<CsvDownload\b/);
assert.match(examRecords, /key\s*:\s*['"]email['"]/);
assert.match(examRecords, /confirmMessage=/);
assert.match(examDetail, /\['Email',row\.email\]/);
for(const source of [exams,examRecords,examDetail]) assert.doesNotMatch(source,/\bcanViewPii\b/);
const examPage=read('features/results/Exams.tsx');
assert.doesNotMatch(examPage,/canViewPii=/);
assert.match(examPage,/user\.can_view_pii/); // still part of identity boundary
// Keep Lead's concrete free-text mitigation and Quality's global admin-only metadata.
assert.match(read('features/admissions/leads/components/Records.tsx'),/canExport\(canViewPii\)/);
const qualityPermissions=read('features/system/Quality.tsx');
assert.match(qualityPermissions,/isAdmin && data\.pipeline/);
assert.match(qualityPermissions,/tab === 'import' && isAdmin/);
assert.doesNotMatch(qualityPermissions,/isAdmin && partner === null/);
// Real data contracts: source-only guards below are supplementary.
const channel={contacts:8,web_registered:5,unregistered:3,paid:2,budget_visible:true,budget:0,original_report:{registrations:10}};
assert.ok(conversionValid(channel));assert.ok(!conversionValid({...channel,paid:6}));assert.ok(!conversionValid({...channel,unregistered:4}));
const hidden={...channel,budget_visible:false};assert.deepEqual(budgeted([channel,hidden]),[channel]);assert.deepEqual(reconciliationRows([channel,hidden,{...channel,original_report:null}]),[channel]);
const opts={board:['A','B'],region:['Miền Bắc']};
assert.deepEqual(scopedOptions({viewing_partner:'NEU',contacts:opts},'NEU'),opts);
assert.equal(scopedOptions({viewing_partner:'OTHER',contacts:opts},'NEU'),undefined);
assert.equal(scopedOptions({viewing_partner:'NEU',contacts:{board:[]}},'NEU'),undefined);
assert.deepEqual(normalize({board:' B,A,A ',date_from:'2026-01-01'}),{board:'A,B',date_from:'2026-01-01'});
assert.ok(filterError({board:'C'},opts));assert.ok(filterError({date_from:'2026-02-29'},opts));assert.ok(filterError({date_from:'2026-02-01',date_to:'2026-01-01'},opts));assert.equal(filterError({date_from:'2024-02-29',board:'A,B'},opts),null);
const m=new URL(marketingPath('summary','NEU',{board:'B,A',region:'Miền Bắc',date_to:'2026-10-01'}),'https://example.invalid');assert.equal(m.pathname,'/marketing/summary');assert.equal(m.searchParams.get('partner'),'NEU');assert.equal(m.searchParams.get('board'),'A,B');assert.equal(m.searchParams.get('region'),'Miền Bắc');
assert.equal(marketingPath('options',null,{board:'A'}),'/meta/options');assert.equal(sponsorshipPath(null),'/sponsorship/summary');assert.equal(sponsorshipPath('A B'),'/sponsorship/summary?partner=A+B');
assert.equal(progress(0),0);assert.equal(progress(1),1);for(const value of [null,undefined,-1,1.1,NaN])assert.equal(progress(value),null);
const benefit={item:'Hạng mục test',status:'Hoàn thành 100%',progress:1};assert.deepEqual(benefitStatus(benefit),{text:'Hoàn thành 100%',tone:'primary',value:1,duplicatePercent:true});assert.equal(benefitStatus({...benefit,status:'Hoàn thành'}).duplicatePercent,false);
assert.deepEqual(metrics({benefits:[benefit,{...benefit,progress:null},{...benefit,progress:0}],reach:[{reach:0,engagement:null}]}),{average:.5,complete:1,total:3,reach:0,engagement:null});
const marketing=read('features/communications/Marketing.tsx');
const marketingAnalytics=read('features/communications/marketing/components/Analytics.tsx');
for(const field of ['original_report?.registrations','original_report?.revenue','original_report?.roi','original_report?.comment','active_candidates_assumed','Đối soát: đăng ký theo kênh','Đối soát: doanh thu theo kênh'])assert.ok(marketingAnalytics.includes(field),field);
assert.equal((marketingAnalytics.match(/<ChannelChart\b/g)??[]).length,8);
assert.ok(marketing.includes('PageRefresh'));assert.ok(marketing.includes('scopedOptions'));
const shared=read('features/communications/components/ChannelChart.tsx');
for(const field of ['@/shared/charts/Chart','@/shared/AnalysisTable','@/shared/format'])assert.ok(shared.includes(field),field);
assert.ok(!shared.includes('com-bar-track'));assert.ok(!shared.includes('rows.slice('));assert.match(shared,/chartBase\(\s*p\s*,\s*true\s*,\s*l\s*\)/);
const filter=read('features/communications/marketing/components/Filters.tsx');assert.ok(filter.includes('@/shared/ResponsiveDialog'));assert.ok(filter.includes('filterError(draft,options)'));
const sponsor=read('features/communications/Sponsorship.tsx');const sponsorAnalytics=read('features/communications/sponsorship/components/Analytics.tsx');
assert.ok(sponsor.includes('PageRefresh'));assert.ok(sponsor.includes('scopeStatus'));assert.ok(!sponsorAnalytics.includes('ViewSwitch'));assert.match(sponsorAnalytics,/<BenefitRow\b/);assert.equal((sponsorAnalytics.match(/<ChannelChart\b/g)??[]).length,4);
const quality=read('features/system/Quality.tsx');
assert.ok(quality.includes('data.by_issue.map'));assert.ok(quality.includes('data.by_reason.map'));
assert.match(quality,/<SourceDistribution\s+title=/);assert.match(read('features/system/components/SourceDistribution.tsx'),/stack\s*:\s*['"]source['"]/);
console.log('PASS: parity, communications data contracts and source guards. Browser/API/ETL acceptance remains separate.');

// V62: Excel CTR (%) stores percentage points; ratio formatter remains unchanged.
assert.equal(percentagePointsText(3.5),'3,5%');
assert.equal(percentagePointsText(4.1),'4,1%');
assert.equal(percentagePointsText(.5),'0,5%');
assert.equal(percentagePointsText(0),'0%');
for(const missing of [null,undefined,NaN,Infinity])assert.equal(percentagePointsText(missing),'—');
assert.equal(percentText(.035),'3,5%');
assert.equal(percentText(3.5),'350%');

// V65: all local chart boundaries delegate to one shared implementation.
const chartConsumers = [
  'features/admissions/contacts/components/Analytics.tsx',
  'features/admissions/leads/components/Analytics.tsx',
  'features/results/exams/components/Analytics.tsx',
  'features/overview/components/Analysis.tsx',
  'features/communications/components/ChannelChart.tsx',
  'features/system/components/SourceDistribution.tsx',
  'shared/charts/GradeDistribution.tsx',
];
for(const path of chartConsumers){
  const code=read(path);
  assert.match(code,/import\s*\{\s*ChartBoundary\s*\}/,path);
  assert.doesNotMatch(code,/class\s+(ChartBoundary|Boundary)\s+extends/,path);
}
for(const path of chartConsumers.slice(0,4)){
  const code=read(path);
  assert.match(code,/<MatrixAnalysisTable\b/,path);
  // Contacts still has a deliberately specialized HTML heatmap.
  assert.doesNotMatch(code,/<table\s+className=['"](?:ct-table|ld-table|exm-data-table|ov-table)['"]/,path);
}
assert.match(read('shared/AnalysisTable.tsx'),/<AnalysisTable\b/);
assert.match(read('shared/charts/ChartBoundary.tsx'),/class\s+ChartBoundary\s+extends\s+Component/);
console.log('PASS: shared analytical table and chart boundary wiring.');
