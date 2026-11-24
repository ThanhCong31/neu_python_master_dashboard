/** Breakpoints refer to the chart host, not the window (sidebar consumes width). */
export type ChartLayout = {
  tier: 'narrow' | 'compact' | 'medium' | 'wide' | 'large';
  compact: boolean;
  narrow: boolean;
  tickBudget: number;
};

export function chartLayoutForWidth(width: number): ChartLayout {
  if (width < 340) return { tier:'narrow', compact:true, narrow:true, tickBudget:3 };
  if (width < 480) return { tier:'compact', compact:true, narrow:false, tickBudget:4 };
  if (width < 680) return { tier:'medium', compact:false, narrow:false, tickBudget:5 };
  if (width < 1000) return { tier:'wide', compact:false, narrow:false, tickBudget:7 };
  return { tier:'large', compact:false, narrow:false, tickBudget:9 };
}

/** Sample labels, never the actual data. Always include the first and last dates. */
export function categoryTickIndices(length: number, budget: number): Set<number> {
  const count = Math.min(length, Math.max(2, Math.floor(budget)));
  const indices = new Set<number>();
  if (count <= 0) return indices;
  if (count === 1) return new Set([0]);
  for (let i=0; i<count; i++) indices.add(Math.round(i*(length-1)/(count-1)));
  return indices;
}

/** Input is the complete Vietnamese date label used by the tooltip / table. */
export function shortChartDate(label: string, multipleYears: boolean): string {
  const match = /^(\d{2}\/\d{2})\/(\d{4})$/.exec(label);
  if (!match) return label;
  return multipleYears ? `${match[1]}/${match[2].slice(-2)}` : match[1];
}
