import { LoadingState } from "@/shared/LoadingState";
import {Component,lazy,Suspense,useState,type ReactNode} from 'react';
import {Button} from '@/components/expressive/button';
import {WorkspaceSelect} from '@/shared/WorkspaceSelect';
import {numberText,percentText,tableCellValue} from '@/shared/format';
import {GradeDistribution} from '@/shared/charts/GradeDistribution';
import {boardColor} from '@/shared/charts/grade-distribution';
import {chartTickBudget,groupLabelWidth} from '@/shared/charts/chart-style';
import {categoryTickIndices} from '@/shared/charts/responsive';
import type {ChartLayout} from '@/shared/charts/responsive';
import {chartBase,type ChartPalette} from '@/shared/charts/theme';
import type {useResource} from '@/services/useResource';
import {dimensions,scoreText,textValue,finite,countValid,sectionLabel,type Summary,type Round,type Dimension,type ExamOptions,type Filters} from '../model';
import {exactGroupFilter} from '../query';
import {bins,histogram,gradeGroups,gradeRoundComparison,roundLabels,sectionRatio} from '../analytics';
const Chart=lazy(()=>import('@/shared/charts/Chart'));
class ChartBoundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}render(){return this.state.failed?<p role="alert" className="dw-error">Không tải được biểu đồ. Hãy mở bảng số liệu.</p>:this.props.children;}}
const numericHeaders=new Set(["Thí sinh","TB VL","Đạt ngưỡng","Vào CK","Min VL","Max VL","TB CK","Trung vị VL","Điểm TB","Điểm tối đa","Tỷ lệ","Vòng loại","Chung kết","Hạng CK","Số mục"]);
function DataTable({headers,rows,label}:{headers:string[];rows:ReactNode[][];label:string}){return <div className="exm-data-scroll focus-ring" tabIndex={0} role="region" aria-label={label}><table className="exm-data-table"><thead><tr>{headers.map(h=><th key={h} scope="col" data-align={numericHeaders.has(h)?"end":undefined}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((v,j)=>j===0?<th key={j} scope="row">{v}</th>:<td key={j} data-align={numericHeaders.has(headers[j])?"end":undefined}>{tableCellValue(v)}</td>)}</tr>)}</tbody></table></div>;}
function Histogram({data}:{data:Summary}){const [table,setTable]=useState(false);const h=histogram(data.histogram,data.kpi.count);const chartable=h.valid&&h.boards.length>0&&h.boards.length<=4;const makeOption=(p:ChartPalette,l:ChartLayout)=>{const ticks=categoryTickIndices(10,chartTickBudget(l,8));return {grid:{left:4,right:12,top:42,bottom:12,containLabel:true},legend:{type:'scroll',top:0,left:0,right:0,textStyle:{color:p.text},pageTextStyle:{color:p.text},pageIconColor:p.primary,pageIconInactiveColor:p.grid},xAxis:{type:'category',data:bins,axisLabel:{color:p.muted,fontSize:l.compact?10:12,interval:(i:number)=>ticks.has(i),hideOverlap:true},axisTick:{show:false}},yAxis:{type:'value',min:0,minInterval:1,splitNumber:l.compact?3:5,axisLabel:{color:p.muted},splitLine:{lineStyle:{color:p.grid}}},series:h.boards.map((b,i)=>({name:b??'Chưa rõ bảng',type:'bar',stack:'score',barMaxWidth:42,data:h.values(b),itemStyle:{color:boardColor(b??'Chưa rõ bảng',p,i)}}))};};return <section className="exm-panel"><div className="exm-head"><div><h2>Phân bố tổng điểm Vòng loại</h2><p className="dw-note">Số thí sinh theo khoảng 100 điểm, tách theo bảng thi. {finite(data.params?.certificate_threshold)&&<>Từ {scoreText(data.params?.certificate_threshold)} điểm trở lên đạt ngưỡng chứng chỉ.</>}</p></div>{chartable&&<Button motion="standard" variant="text" onClick={()=>setTable(v=>!v)}>{table?'Biểu đồ':'Bảng số liệu'}</Button>}</div>{!h.valid&&<p className="dw-error" role="alert">Khoảng điểm hoặc số đếm không hợp lệ. Hiển thị số liệu nguồn.</p>}{!data.histogram.length?<p className="dw-note">Không có điểm vòng loại được phân nhóm.</p>:chartable&&!table?<ChartBoundary><Suspense fallback={<LoadingState label="Đang tải biểu đồ…" chartHeight={300} compactChartHeight={260}/>}><Chart label="Phân bố điểm vòng loại theo bảng" makeOption={makeOption} height={300} compactHeight={260}/></Suspense></ChartBoundary>:<DataTable label="Số liệu phân bố điểm" headers={['Khoảng điểm','Bảng','Thí sinh']} rows={h.valid?bins.flatMap((bin,i)=>h.boards.map(b=>[bin,textValue(b),numberText(h.values(b)[i])])):data.histogram.map(r=>[bins[r.bin]??`Bin ${r.bin}`,textValue(r.board),numberText(r.count)])}/>}<p className="dw-note">{numberText(h.sum)} / {numberText(data.kpi.count)} hồ sơ có điểm được phân nhóm.{h.valid&&h.sum<data.kpi.count?' Các hồ sơ còn lại vẫn được tính trong KPI tổng.':''}</p></section>;}
const roundOptions = [
  { value: 'all', label: 'Cả hai vòng' },
  { value: 'qualifier', label: roundLabels.qualifier },
  { value: 'final', label: roundLabels.final },
] as const;

function roundGroupLabel(board: string | null, round: Round, separator = ' · ') {
  return (board ?? 'Chưa rõ bảng') + separator + roundLabels[round];
}

function GradeComparison({ data }: { data: Summary }) {
  const [table, setTable] = useState(false);
  const { categories, groups } = gradeRoundComparison(data.grades, data.grade_order);
  const chartable = groups.length > 0 && groups.length <= 8 && categories.length > 0 && categories.length <= 6
    && groups.every(group => group.valid && group.total > 0);
  const label = 'Tỷ trọng xếp loại theo bảng và vòng';
  const makeOption = (palette: ChartPalette, layout: ChartLayout) => {
    const colors = [palette.primary, palette.tertiary, palette.secondary, palette.error, palette.onSecondaryContainer, palette.outline];
    return {
      legend: {},
      grid: { left: 4, right: 16, top: 12, bottom: 12, containLabel: true },
      xAxis: { type: 'value', min: 0, max: 100, interval: layout.compact ? 50 : 25, axisLabel: { formatter: '{value}%' } },
      yAxis: {
        type: 'category',
        inverse: true,
        data: groups.map(group => roundGroupLabel(group.board, group.round)),
        axisLine: { show: false },
        axisLabel: {
          width: layout.narrow ? 76 : layout.compact ? 108 : 180,
          overflow: 'truncate',
          formatter: (value: string, index: number) => layout.compact
            ? roundGroupLabel(groups[index].board, groups[index].round, '\n')
            : value,
        },
      },
      series: categories.map((grade, index) => ({
        name: grade,
        type: 'bar',
        stack: 'grade-share',
        barMaxWidth: 28,
        itemStyle: { color: colors[index] },
        data: groups.map(group => 100 * group.grades[index].count / group.total),
        tooltip: {
          valueFormatter: (value: unknown, dataIndex: number) => {
            const group = groups[dataIndex];
            return finite(value) && group
              ? `${percentText(value / 100)} · ${numberText(group.grades[index].count)}/${numberText(group.total)}`
              : '—';
          },
        },
      })),
    };
  };
  return <>
    <div className="exm-head">
      <h3>Tỷ trọng xếp loại</h3>
      {chartable && <Button motion="standard" variant="text" size="sm" onClick={() => setTable(value => !value)}>
        {table ? 'Biểu đồ' : 'Bảng số liệu'}
      </Button>}
    </div>
    {!groups.length ? <p className="dw-note">Chưa có dữ liệu xếp loại.</p> : chartable && !table ?
      <ChartBoundary><Suspense fallback={<LoadingState label="Đang tải biểu đồ…" chartHeight={Math.max(220, groups.length * 50 + 48)}/>}>
        <Chart label={label} makeOption={makeOption} height={Math.max(220, groups.length * 50 + 48)}/>
      </Suspense></ChartBoundary> :
      <DataTable label={label} headers={['Bảng và vòng', 'Thí sinh', ...categories]} rows={groups.map(group => [
        roundGroupLabel(group.board, group.round),
        group.valid ? numberText(group.total) : '—',
        ...group.grades.map(grade => group.valid && group.total > 0
          ? `${numberText(grade.count)} (${percentText(grade.count / group.total)})`
          : numberText(grade.count)),
      ])}/>}
    {groups.length > 0 && <p className="dw-note">Tỷ trọng tính trên số thí sinh có xếp loại trong từng bảng và vòng; chung kết thường ít người nên tỷ trọng kém ổn định.</p>}
  </>;
}

function Rounds({ data }: { data: Summary }) {
  const [round, setRound] = useState<Round | 'all'>('all');
  const [sectionTable,setSectionTable]=useState(false);
  const grades = round === 'all' ? [] : gradeGroups(data.grades.filter(row => row.round === round), data.grade_order);
  const categories = [...new Set([...data.grade_order, ...grades.flatMap(group => group.grades.map(grade => grade.grade))])];
  const sections = data.sections.filter(row => round === 'all' || row.round === round);
  const sectionKeys = [...new Set(sections.map(row => row.section))];
  return <section className="exm-panel">
    <div className="exm-head">
      <h2>Xếp loại & phần thi</h2>
      <WorkspaceSelect label="Vòng thi" value={round} options={roundOptions} onChange={setRound}/>
    </div>
    <div className="exm-analysis-pair exm-grade-pair">
      <div className="exm-subpanel">
        {round === 'all' ? <GradeComparison data={data}/> : <>
          <h3>Xếp loại</h3>
          <GradeDistribution label={`Xếp loại theo bảng · ${roundLabels[round]}`} categories={categories}
            rows={grades.map(group => ({ board: group.board ?? 'Chưa rõ bảng', counts: categories.map(category => group.grades.find(grade => grade.grade === category)?.count ?? 0) }))}/>
          {grades.length > 0 && <p className="dw-note">Biểu đồ hiển thị số thí sinh. Bảng số liệu có thêm tỷ trọng trong từng bảng.</p>}
        </>}
      </div>
      <div className="exm-subpanel">
        <div className="exm-head"><h3>Điểm theo phần thi</h3>{sections.length>0&&<Button motion="standard" variant="text" size="sm" onClick={()=>setSectionTable(v=>!v)}>{sectionTable?"Biểu đồ":"Bảng số liệu"}</Button>}</div>
        {!sections.length ? <p className="dw-note">Chưa có điểm phần thi.</p> : <>
          <p className="dw-note">Điểm TB ÷ điểm tối đa của phần — phần có tỷ lệ thấp hơn là nội dung cần chú ý khi ôn tập.</p>
          {sectionTable?<DataTable label="Điểm theo phần thi" headers={['Bảng','Vòng thi','Phần thi','Điểm TB','Điểm tối đa','Tỷ lệ','Số mục']} rows={sections.map(row=>[textValue(row.board),roundLabels[row.round],data.structure?.find(item=>item.board===row.board&&item.round===row.round&&item.section===row.section)?.section_label??sectionLabel(row.section),scoreText(row.avg),scoreText(row.max_score),percentText(sectionRatio(row)),numberText(row.count)])}/>:<div className="exm-section-grid">
            {sectionKeys.map(section => {
              const items = sections.filter(row => row.section === section).sort((a, b) =>
                (a.board ?? '').localeCompare(b.board ?? '', 'vi') || Number(a.round === 'final') - Number(b.round === 'final'),
              );
              const labels = new Set(items.map(row => data.structure?.find(item =>
                item.board === row.board && item.round === row.round && item.section === section,
              )?.section_label ?? sectionLabel(section)));
              return <section className="exm-section-group" key={section}>
                <h4>{labels.size === 1 ? [...labels][0] : sectionLabel(section)}</h4>
                {items.map(row => {
                  const ratio = sectionRatio(row);
                  return <div className="exm-bar-row" key={JSON.stringify([row.board, row.round])}>
                    <div>
                      <span>{round === 'all' ? roundGroupLabel(row.board, row.round) : row.board ?? 'Chưa rõ bảng'}</span>
                      <strong>{percentText(ratio)}</strong>
                    </div>
                    <p className="dw-note">TB {numberText(row.avg, 2)} / {scoreText(row.max_score)} · {numberText(row.count)} mục ghi nhận</p>
                    {ratio !== null && <div className="exm-track" aria-hidden="true"><span style={{ width: `${ratio * 100}%` }}/></div>}
                  </div>;
                })}
              </section>;
            })}
          </div>}
        </>}
      </div>
    </div>
    {round === 'all' && <p className="dw-note">Hai vòng có thể khác tập thí sinh và đề thi.</p>}
  </section>;
}
const validBox=(box:number[]|null|undefined):box is number[]=>Array.isArray(box)&&box.length===5&&box.every((v,i)=>finite(v)&&v>=0&&v<=1000&&(i===0||v>=box[i-1]));
const safeChartText=(value:unknown)=>String(value??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]??c));
function Groups({data,options,filters,onGroup}:{data:Summary;options:ExamOptions;filters:Filters;onGroup:(f:Filters)=>void}) {
  const [dim,setDim]=useState<Dimension|'by_paid'>('by_board');
  const [showChart,setShowChart]=useState(false);
  const rows=dim==='by_paid'?(data.by_paid??[]):(data[dim]??[]);
  const labelFor=(r:typeof rows[number])=>dim==='by_paid'?(r.key===true?'Đã thanh toán':r.key===false?'Chưa thanh toán':'Chưa xác định'):textValue(r.key);
  const plotRows=dim==='by_school'?rows.filter(r=>validBox(r.box)).sort((a,b)=>b.box![2]-a.box![2]):[...rows].filter(r=>finite(r.avg)&&r.avg>=0&&r.avg<=1000).sort((a,b)=>(b.avg??0)-(a.avg??0));
  const chartable=(dim==='by_school'||dim==='by_province'||dim==='by_paid')&&plotRows.length>0;
  const title=dim==='by_school'?'Phân bố điểm theo trường':dim==='by_province'?'Điểm TB vòng loại theo tỉnh/thành':'Đã thanh toán và chưa thanh toán';
  const height=Math.max(200,plotRows.length*30+44);
  const makeOption=(p:ChartPalette,l:ChartLayout)=>({
    grid:{left:2,right:20,top:12,bottom:12,containLabel:true},
    tooltip:{...chartBase(p,true,l).tooltip,trigger:'item',...(dim==='by_school'?{formatter:(params:unknown)=>{const index=(params as {dataIndex?:number})?.dataIndex;const row=typeof index==='number'?plotRows[index]:undefined;if(!row||!validBox(row.box))return '';return [safeChartText(labelFor(row)),`Thí sinh: ${numberText(row.count)}`, ...['Min','Q1','Trung vị','Q3','Max'].map((label,i)=>`${label}: ${safeChartText(scoreText(row.box![i]))}`)].join('<br>');}}:{valueFormatter:(v:unknown)=>scoreText(v)})},
    xAxis:{type:'value',min:0,max:1000,splitNumber:l.compact?3:5},
    yAxis:{type:'category',inverse:true,data:plotRows.map(labelFor),axisLabel:{width:groupLabelWidth(l),overflow:'truncate'}},
    series:dim==='by_school'?[{name:'Điểm vòng loại',type:'boxplot',layout:'vertical',data:plotRows.map(r=>r.box!),itemStyle:{color:p.surface,borderColor:p.primary,borderWidth:2}}]:[{name:'Điểm TB vòng loại',type:'bar',data:plotRows.map(r=>r.avg),barMaxWidth:24,itemStyle:{color:p.primary}}],
  });
  const headers=['Nhóm','Thí sinh','TB VL','Min VL','Max VL',...(dim==='by_school'?['Trung vị VL']:[]),...(dim==='by_board'?['TB CK']:[]),'Đạt ngưỡng','Vào CK','Chi tiết'];
  return <section className="exm-panel"><div className="exm-head"><h2>Phân tích theo nhóm</h2><WorkspaceSelect<Dimension|'by_paid'> label="Nhóm theo" value={dim} options={[...dimensions.map(([value,label])=>({value,label})),{value:'by_paid',label:'Thanh toán'}]} onChange={v=>{setDim(v);setShowChart(false);}}/>{chartable&&<Button motion="standard" variant="text" onClick={()=>setShowChart(v=>!v)} aria-pressed={showChart}>{showChart?'Bảng số liệu':'Biểu đồ'}</Button>}</div>
    {showChart&&chartable?<><h3>{title}</h3><div className="focus-ring" style={{maxHeight:420,overflow:'auto',minWidth:0}} role="region" tabIndex={0} aria-label={title}><ChartBoundary key={dim}><Suspense fallback={<LoadingState label="Đang tải biểu đồ…" chartHeight={height} compactChartHeight={height}/>}><Chart label={title} makeOption={makeOption} height={height} compactHeight={height}/></Suspense></ChartBoundary></div>{dim==='by_school'&&<p className="dw-note">Hộp = khoảng tứ phân vị, vạch giữa = trung vị; sắp theo trung vị giảm dần. Hai đầu = Min–Max.</p>}{dim==='by_paid'&&<p className="dw-note">Điểm TB Vòng loại của 2 nhóm.</p>}{plotRows.length<rows.length&&<p className="dw-note">{numberText(plotRows.length)}/{numberText(rows.length)} nhóm có số liệu hợp lệ để vẽ. Bảng có đầy đủ nhóm.</p>}</>:rows.length?<DataTable label="Thống kê theo nhóm" headers={headers} rows={rows.map(r=>{
      const paid=typeof r.key==='boolean'?String(r.key):null;
      const f:Filters|null=dim==='by_paid'?(paid&&(!filters.paid||filters.paid===paid)?{paid}:null):exactGroupFilter(dim,typeof r.key==='string'?r.key:null,options,filters);
      const label=labelFor(r);
      return [label,numberText(r.count),scoreText(r.avg),scoreText(r.min),scoreText(r.max),...(dim==='by_school'?[scoreText(r.box?.[2])]:[]),...(dim==='by_board'?[scoreText(data.final_by_board?.find(row=>row.key===r.key)?.avg)]:[]),`${numberText(r.certificates)} (${percentText(r.cert_rate)})`,numberText(r.finalists),f?<Button motion="standard" variant="text" onClick={()=>onGroup(f)}>Xem thí sinh</Button>:'—'];
    })}/>:<p className="dw-note">Không có dữ liệu theo nhóm.</p>}
    <p className="dw-note">Điểm vòng loại và chung kết tính trên các điểm có giá trị của từng vòng; hai tập có thể khác nhau. Tỷ lệ chứng chỉ tính trên toàn bộ hồ sơ trong nhóm.</p>
  </section>;
}
export default function Analytics({resource,ready,hasSearch,options,filters,onGroup,canViewPii}:{canViewPii:boolean;resource:ReturnType<typeof useResource<Summary>>;ready:boolean;hasSearch:boolean;options:ExamOptions;filters:Filters;onGroup:(f:Filters)=>void}){if(!ready)return <p className="exm-panel exm-state">Hãy kiểm tra bộ lọc.</p>;if(resource.state==='loading')return <LoadingState className="exm-panel" label="Đang tải phân tích…"/>;if(resource.state==='error')return <div className="exm-panel exm-state"><p role="alert">{resource.message}</p><Button motion="standard" variant="tonal" onClick={resource.retry}>Thử lại</Button></div>;const data=resource.data,k=data.kpi;const threshold=data.params?.certificate_threshold,top=data.params?.top_ratio;return <div className="exm-analysis">{resource.refreshing&&<p className="dw-note" role="status">Đang làm mới phân tích…</p>}{resource.refreshError&&<p className="dw-error" role="alert">{resource.refreshError} · Đang hiển thị dữ liệu lần tải trước.</p>}{hasSearch&&<p className="dw-note">Tìm kiếm chỉ áp dụng cho danh sách và CSV, không áp dụng cho phân tích.</p>}<dl className="exm-metrics"><div><dt>Thí sinh trong phạm vi</dt><dd>{numberText(k.count)}</dd><p>Hồ sơ khớp bộ lọc</p></div><div><dt>Điểm TB vòng loại</dt><dd>{numberText(k.avg,2)}</dd><p>Min {scoreText(k.min)} · Max {scoreText(k.max)}</p></div><div><dt>Vào chung kết</dt><dd>{numberText(k.finalists)}</dd><p>{finite(top)&&top>0&&top<=1?`Top ${percentText(top)} mỗi bảng (có thể đồng hạng).`:'Theo cờ backend.'}</p></div><div><dt>Đạt ngưỡng chứng chỉ</dt><dd>{numberText(k.certificates)}</dd><p>{percentText(k.cert_rate)} · {finite(threshold)&&threshold>=0?`Ngưỡng ${scoreText(threshold)} ở một trong hai vòng`:'Chưa có thông số ngưỡng'}</p></div></dl>{(![k.count,k.finalists,k.certificates].every(countValid)||k.finalists>k.count||k.certificates>k.count)&&<p className="dw-error" role="alert">Số liệu KPI không nhất quán.</p>}<Histogram data={data}/><Rounds data={data}/><Groups data={data} options={options} filters={filters} onGroup={onGroup}/><Finalists data={data} canViewPii={canViewPii}/></div>;}

function Finalists({data,canViewPii}:{data:Summary;canViewPii:boolean}) {
  const [table,setTable]=useState(false);
  const rows=data.finalists??[];
  const points=rows.filter(r=>finite(r.qualifier)&&r.qualifier>=0&&r.qualifier<=1000&&finite(r.final)&&r.final>=0&&r.final<=1000);
  const boards=[...new Set(points.map(r=>r.board??'Chưa rõ bảng'))].sort();
  const makeOption=(p:ChartPalette,l:ChartLayout)=>({
    grid:{left:8,right:16,top:12,bottom:24,containLabel:true},legend:boards.length>1?{}:undefined,
    tooltip:{...chartBase(p,true,l).tooltip,trigger:'item',formatter:(params:unknown)=>{const point=params as {name?:string;value?:unknown[];seriesName?:string};return [safeChartText(point.seriesName),...(canViewPii&&point.name?[safeChartText(point.name)]:[]),`Vòng loại: ${safeChartText(scoreText(point.value?.[0]))}`,`Chung kết: ${safeChartText(scoreText(point.value?.[1]))}`].join('<br>');}},
    xAxis:{type:'value',min:0,max:1000,name:'Vòng loại',nameLocation:'middle',nameGap:28,splitNumber:l.compact?3:5},
    yAxis:{type:'value',min:0,max:1000,name:'Chung kết',nameLocation:'middle',nameGap:34,splitNumber:l.compact?3:5},
    series:boards.map((board,i)=>({name:board,type:'scatter',symbolSize:9,itemStyle:{color:boardColor(board,p,i),opacity:.8},data:points.filter(r=>(r.board??'Chưa rõ bảng')===board).map(r=>({name:canViewPii?[r.full_name,r.school].filter(Boolean).join(' · '):'',value:[r.qualifier,r.final]}))})),
  });
  return <section className="exm-panel"><div className="exm-head"><div><h2>Vòng loại → Chung kết</h2><p className="dw-note">Mỗi chấm là 1 thí sinh vào chung kết có điểm ở cả hai vòng. Dữ liệu giả lập.</p></div>{points.length>0&&<Button motion="standard" variant="text" onClick={()=>setTable(v=>!v)} aria-pressed={table}>{table?'Biểu đồ':'Bảng số liệu'}</Button>}</div>
    {!rows.length?<p className="dw-note">Chưa có bản ghi chung kết.</p>:table||!points.length?<DataTable label="Đối chiếu điểm hai vòng" headers={[...(canViewPii?['Họ tên']:[]),'Bảng',...(canViewPii?['Trường']:[]),'Vòng loại','Chung kết','Hạng CK']} rows={rows.map(r=>[...(canViewPii?[textValue(r.full_name)]:[]),textValue(r.board),...(canViewPii?[textValue(r.school)]:[]),scoreText(r.qualifier),scoreText(r.final),scoreText(r.final_rank)])}/>:<><ChartBoundary><Suspense fallback={<LoadingState label="Đang tải biểu đồ…" chartHeight={300} compactChartHeight={260}/>}><Chart label="Đối chiếu điểm vòng loại và chung kết" makeOption={makeOption} height={300} compactHeight={260}/></Suspense></ChartBoundary>{points.length<rows.length&&<p className="dw-note">{numberText(points.length)}/{numberText(rows.length)} hồ sơ có điểm ở cả hai vòng. Bảng số liệu có đầy đủ bản ghi.</p>}</>}
  </section>;
}
