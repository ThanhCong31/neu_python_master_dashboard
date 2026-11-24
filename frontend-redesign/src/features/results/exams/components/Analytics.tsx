import { LoadingState } from "@/shared/LoadingState";
import {Component,lazy,Suspense,useState,type ReactNode} from 'react';
import {Button} from '@/components/expressive/button';
import {WorkspaceSelect} from '@/shared/WorkspaceSelect';
import {numberText,percentText} from '@/shared/format';
import {GradeDistribution} from '@/shared/charts/GradeDistribution';
import {boardColor} from '@/shared/charts/grade-distribution';
import {chartTickBudget} from '@/shared/charts/chart-style';
import {categoryTickIndices} from '@/shared/charts/responsive';
import type {ChartLayout} from '@/shared/charts/responsive';
import type {ChartPalette} from '@/shared/charts/theme';
import type {useResource} from '@/services/useResource';
import {dimensions,scoreText,textValue,finite,countValid,sectionLabel,type Summary,type Round,type Dimension,type ExamOptions,type Filters} from '../model';
import {exactGroupFilter} from '../query';
import {bins,histogram,gradeGroups,gradeRoundComparison,roundLabels,sectionRatio} from '../analytics';
const Chart=lazy(()=>import('@/shared/charts/Chart'));
class ChartBoundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}render(){return this.state.failed?<p role="alert" className="dw-error">Không tải được biểu đồ. Hãy mở bảng số liệu.</p>:this.props.children;}}
const numericHeaders=new Set(["Thí sinh","TB VL","Đạt ngưỡng","Vào CK"]);
function DataTable({headers,rows,label}:{headers:string[];rows:ReactNode[][];label:string}){return <div className="exm-data-scroll focus-ring" tabIndex={0} role="region" aria-label={label}><table className="exm-data-table"><thead><tr>{headers.map(h=><th key={h} scope="col" data-align={numericHeaders.has(h)?"end":undefined}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((v,j)=>j===0?<th key={j} scope="row">{v}</th>:<td key={j} data-align={numericHeaders.has(headers[j])?"end":undefined}>{v}</td>)}</tr>)}</tbody></table></div>;}
function Histogram({data}:{data:Summary}){const [table,setTable]=useState(false);const h=histogram(data.histogram,data.kpi.count);const chartable=h.valid&&h.boards.length>0&&h.boards.length<=4;const makeOption=(p:ChartPalette,l:ChartLayout)=>{const ticks=categoryTickIndices(10,chartTickBudget(l,8));return {grid:{left:4,right:12,top:42,bottom:12,containLabel:true},legend:{type:'scroll',top:0,left:0,right:0,textStyle:{color:p.text},pageTextStyle:{color:p.text},pageIconColor:p.primary,pageIconInactiveColor:p.grid},xAxis:{type:'category',data:bins,axisLabel:{color:p.muted,fontSize:l.compact?10:12,interval:(i:number)=>ticks.has(i),hideOverlap:true},axisTick:{show:false}},yAxis:{type:'value',min:0,minInterval:1,splitNumber:l.compact?3:5,axisLabel:{color:p.muted},splitLine:{lineStyle:{color:p.grid}}},series:h.boards.map((b,i)=>({name:b??'Chưa rõ bảng',type:'bar',stack:'score',barMaxWidth:42,data:h.values(b),itemStyle:{color:boardColor(b??'Chưa rõ bảng',p,i)}}))};};return <section className="exm-panel"><div className="exm-head"><div><h2>Phân bố điểm vòng loại</h2><p className="dw-note">Số thí sinh theo khoảng điểm và bảng thi.</p></div>{chartable&&<Button motion="standard" variant="text" onClick={()=>setTable(v=>!v)}>{table?'Biểu đồ':'Bảng số liệu'}</Button>}</div>{!h.valid&&<p className="dw-error" role="alert">Khoảng điểm hoặc số đếm không hợp lệ. Hiển thị số liệu nguồn.</p>}{!data.histogram.length?<p className="dw-note">Không có điểm vòng loại được phân nhóm.</p>:chartable&&!table?<ChartBoundary><Suspense fallback={<LoadingState label="Đang tải biểu đồ…" chartHeight={300} compactChartHeight={260}/>}><Chart label="Phân bố điểm vòng loại theo bảng" makeOption={makeOption} height={300} compactHeight={260}/></Suspense></ChartBoundary>:<DataTable label="Số liệu phân bố điểm" headers={['Khoảng điểm','Bảng','Thí sinh']} rows={h.valid?bins.flatMap((bin,i)=>h.boards.map(b=>[bin,textValue(b),numberText(h.values(b)[i])])):data.histogram.map(r=>[bins[r.bin]??`Bin ${r.bin}`,textValue(r.board),numberText(r.count)])}/>}<p className="dw-note">{numberText(h.sum)} / {numberText(data.kpi.count)} hồ sơ có điểm được phân nhóm.{h.valid&&h.sum<data.kpi.count?' Các hồ sơ còn lại vẫn được tính trong KPI tổng.':''}</p></section>;}
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
    {groups.length > 0 && <p className="dw-note">Tỷ trọng tính trên số thí sinh có xếp loại trong từng bảng và vòng.</p>}
  </>;
}

function Rounds({ data }: { data: Summary }) {
  const [round, setRound] = useState<Round | 'all'>('all');
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
        <h3>Điểm theo phần thi</h3>
        {!sections.length ? <p className="dw-note">Chưa có điểm phần thi.</p> : <>
          <p className="dw-note">Tỷ lệ = điểm trung bình chia cho điểm tối đa của từng phần.</p>
          <div className="exm-section-grid">
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
          </div>
        </>}
      </div>
    </div>
    {round === 'all' && <p className="dw-note">Hai vòng có thể khác tập thí sinh và đề thi.</p>}
  </section>;
}
function Groups({data,options,filters,onGroup}:{data:Summary;options:ExamOptions;filters:Filters;onGroup:(f:Filters)=>void}){const [dim,setDim]=useState<Dimension>('by_board');const rows=data[dim]??[];return <section className="exm-panel"><div className="exm-head"><h2>Phân tích theo nhóm</h2><WorkspaceSelect label="Nhóm theo" value={dim} options={dimensions.map(([value,label])=>({value,label}))} onChange={setDim}/></div>{rows.length?<DataTable label="Thống kê theo nhóm" headers={['Nhóm','Thí sinh','TB VL','Đạt ngưỡng','Vào CK','Chi tiết']} rows={rows.map(r=>{const f=exactGroupFilter(dim,r.key,options,filters);return [textValue(r.key),numberText(r.count),numberText(r.avg,2),`${numberText(r.certificates)} (${percentText(r.cert_rate)})`,numberText(r.finalists),f?<Button motion="standard" variant="text" onClick={()=>onGroup(f)}>Xem thí sinh</Button>:'—'];})}/>:<p className="dw-note">Không có dữ liệu theo nhóm.</p>}<p className="dw-note">Điểm trung bình chỉ tính điểm VL có giá trị. Tỷ lệ chứng chỉ tính trên toàn bộ hồ sơ trong nhóm.</p></section>;}
export default function Analytics({resource,ready,hasSearch,options,filters,onGroup}:{resource:ReturnType<typeof useResource<Summary>>;ready:boolean;hasSearch:boolean;options:ExamOptions;filters:Filters;onGroup:(f:Filters)=>void}){if(!ready)return <p className="exm-panel exm-state">Hãy kiểm tra bộ lọc.</p>;if(resource.state==='loading')return <LoadingState className="exm-panel" label="Đang tải phân tích…"/>;if(resource.state==='error')return <div className="exm-panel exm-state"><p role="alert">{resource.message}</p><Button motion="standard" variant="tonal" onClick={resource.retry}>Thử lại</Button></div>;const data=resource.data,k=data.kpi;const threshold=data.params?.certificate_threshold,top=data.params?.top_ratio;return <div className="exm-analysis">{resource.refreshing&&<p className="dw-note" role="status">Đang làm mới phân tích…</p>}{resource.refreshError&&<p className="dw-error" role="alert">{resource.refreshError} · Đang hiển thị dữ liệu lần tải trước.</p>}{hasSearch&&<p className="dw-note">Tìm kiếm chỉ áp dụng cho danh sách và CSV, không áp dụng cho phân tích.</p>}<dl className="exm-metrics"><div><dt>Thí sinh trong phạm vi</dt><dd>{numberText(k.count)}</dd><p>Hồ sơ khớp bộ lọc</p></div><div><dt>Điểm TB vòng loại</dt><dd>{numberText(k.avg,2)}</dd><p>Min {scoreText(k.min)} · Max {scoreText(k.max)}</p></div><div><dt>Vào chung kết</dt><dd>{numberText(k.finalists)}</dd><p>{finite(top)&&top>0&&top<=1?`Top ${percentText(top)} mỗi bảng (có thể đồng hạng).`:'Theo cờ backend.'}</p></div><div><dt>Đạt ngưỡng chứng chỉ</dt><dd>{numberText(k.certificates)}</dd><p>{percentText(k.cert_rate)} · {finite(threshold)&&threshold>=0?`Ngưỡng ${scoreText(threshold)} ở một trong hai vòng`:'Chưa có thông số ngưỡng'}</p></div></dl>{(![k.count,k.finalists,k.certificates].every(countValid)||k.finalists>k.count||k.certificates>k.count)&&<p className="dw-error" role="alert">Số liệu KPI không nhất quán.</p>}<Histogram data={data}/><Rounds data={data}/><Groups data={data} options={options} filters={filters} onGroup={onGroup}/></div>;}
