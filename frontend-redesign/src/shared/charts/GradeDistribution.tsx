import { ChartBoundary } from './ChartBoundary';
import { LoadingState } from '@/shared/LoadingState';
import { lazy, Suspense, useCallback, useState } from 'react';
import { Button } from '@/components/expressive/button';
import { numberText, percentText } from '../format';
import { type ChartPalette } from './theme';
import type { ChartLayout } from './responsive';
import { gradeChartable, gradeChartOption, type GradeSeries } from './grade-distribution';
import './grade-distribution.css';
const Chart = lazy(() => import('./Chart'));

/** Shared presentation; feature owns dataset, round and denominator semantics. */
export function GradeDistribution({
  categories,
  rows,
  label,
}: {
  categories: string[];
  rows: GradeSeries[];
  label: string;
}) {
  const [table, setTable] = useState(false);
  const valid = gradeChartable(categories, rows);
  const makeOption = useCallback(
    (palette: ChartPalette, layout: ChartLayout) =>
      gradeChartOption(palette, layout, categories, rows),
    [categories, rows],
  );
  if (!rows.length) return <p className="dw-note">Chưa có dữ liệu xếp loại.</p>;
  return (
    <div className="gd-root">
      <div className="gd-tools">
        {valid && (
          <Button motion="standard" variant="text" size="sm" onClick={() => setTable((v) => !v)}>
            {table ? 'Biểu đồ' : 'Bảng số liệu'}
          </Button>
        )}
      </div>
      {valid && !table ? (
        <ChartBoundary>
          <Suspense
            fallback={
              <LoadingState
                label="Đang tải biểu đồ…"
                chartHeight={Math.max(240, categories.length * Math.max(48, rows.length * 25) + 40)}
                compactChartHeight={Math.max(
                  240,
                  categories.length * Math.max(44, rows.length * 20) + 40,
                )}
              />
            }
          >
            <Chart
              label={label}
              makeOption={makeOption}
              height={Math.max(240, categories.length * Math.max(48, rows.length * 25) + 40)}
              compactHeight={Math.max(240, categories.length * Math.max(44, rows.length * 20) + 40)}
            />
          </Suspense>
        </ChartBoundary>
      ) : (
        <>
          <div
            className="gd-scroll focus-ring"
            tabIndex={0}
            role="region"
            aria-label={label + ' — bảng số liệu'}
          >
            <table className="gd-table">
              <thead>
                <tr>
                  <th scope="col">Xếp loại</th>
                  {rows.map((r) => (
                    <th scope="col" key={r.board}>
                      {r.board}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map((g, i) => (
                  <tr key={g}>
                    <th scope="row">{g}</th>
                    {rows.map((r) => {
                      const total = r.counts.reduce((a, b) => a + b, 0);
                      const value = r.counts[i];
                      return (
                        <td key={r.board}>
                          {numberText(value)}
                          {valid && total > 0 && <small>{percentText(value / total)}</small>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!valid && (
            <p className="dw-note">
              Hiển thị bảng số liệu thay cho biểu đồ khi số nhóm hoặc giá trị không phù hợp.
            </p>
          )}
        </>
      )}
    </div>
  );
}
