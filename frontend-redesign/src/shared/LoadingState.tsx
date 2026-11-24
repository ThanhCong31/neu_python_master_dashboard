import type { CSSProperties } from 'react';
import { Loading } from '@/components/expressive/loading';

export function AppLoading() {
  return <main className="app-loading">
    <div className="app-loading-content">
      <div className="app-loading-brand"><img src="/favicon.svg" alt="" width={36} height={36}/><div><strong>NEU</strong><small>Admissions BI</small></div></div>
      <Loading variant="morph" size={48} label="Đang kiểm tra phiên đăng nhập…"/>
    </div>
  </main>;
}

export function LoadingState({ label = 'Đang tải dữ liệu…', className = '', chartHeight, compactChartHeight = chartHeight }: { label?: string; className?: string; chartHeight?: number; compactChartHeight?: number }) {
  if (chartHeight !== undefined) return <div className="loading-chart-container" style={{ '--loading-chart-height': `${chartHeight}px`, '--loading-chart-compact-height': `${compactChartHeight}px` } as CSSProperties}>
    <div className={`loading-region loading-region--chart ${className}`}><Loading variant="morph" size={32} label={label}/></div>
  </div>;
  return <div className={`loading-region ${className}`}><Loading variant="morph" size={40} label={label}/></div>;
}
