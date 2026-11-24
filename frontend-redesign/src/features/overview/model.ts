/** Subset of GET /api/overview consumed by this screen. Optional sections are permission-dependent. */
export interface CrmKpi {
  total: number; web_registered: number; paid: number; revenue: number;
  paid_rate: number | null; unpaid_registered: number; potential_revenue: number;
  free: number; undated_contacts: number; undated_registrations: number; undated_paid: number;
}
export interface TimelinePoint {
  date: string; new_contacts: number; registrations: number; paid: number;
  cum_contacts: number; cum_registrations: number; cum_paid: number;
}
export interface OverviewData {
  modules: string[]; viewing_partner: string | null;
  crm?: { kpi: CrmKpi; funnel: { stage: string; value: number }[]; timeline: TimelinePoint[] };
  marketing?: { kpi: { contacts: number; web_registered: number; paid: number; revenue: number; budget: number | null; roi_program: number | null; roi_paid_channels: number | null }; channels: { channel: string; budget_visible: boolean; is_assumed: boolean | null; assumed_contacts: number }[] };
  exams?: { kpi: { count: number; avg: number | null; max: number | null; finalists: number; certificates: number; cert_rate: number | null }; grades: { board: string | null; grade: string | null; count: number }[] };
  sponsorship?: { benefits: { item: string; progress: number; status: string }[]; avg_progress: number | null; total_reach: number; total_engagement: number };
  pipeline?: { total_raw: number; unique_contacts: number; merged_records: number; duplicate_rate: number } | null;
}
export type Domain = 'crm' | 'marketing' | 'exams' | 'sponsorship';
const domains: readonly [Domain, string][] = [['crm','contacts'], ['exams','exams'], ['sponsorship','sponsorship'], ['marketing','marketing']];
export function visibleDomains(data: OverviewData, allowed: readonly string[]): Domain[] {
  return domains.filter(([key, module]) => data.modules.includes(module) && allowed.includes(module) && data[key] != null).map(([key]) => key);
}
export function overviewPath(partner: string | null) {
  return '/overview' + (partner ? `?${new URLSearchParams({partner})}` : '');
}
export function ratio(n: number, d: number): number | null { return Number.isFinite(n) && Number.isFinite(d) && d > 0 ? n/d : null; }
export function validFunnel(k: CrmKpi) {
  return [k.total,k.web_registered,k.paid].every(n=>Number.isInteger(n)&&n>=0) && k.total>=k.web_registered && k.web_registered>=k.paid;
}
export const gradeOrder = ['Giỏi','Khá','Trung bình','Yếu','Chưa xếp loại'];
export function gradeRows(grades: NonNullable<OverviewData['exams']>['grades']) {
  const rows = new Map<string, Map<string, number>>();
  for (const row of grades) {
    const board = row.board || 'Chưa rõ bảng';
    const grade = row.grade && gradeOrder.includes(row.grade) ? row.grade : 'Chưa xếp loại';
    const counts = rows.get(board) ?? new Map<string,number>();
    counts.set(grade,(counts.get(grade) ?? 0)+row.count); rows.set(board,counts);
  }
  return [...rows].sort(([a],[b])=>a.localeCompare(b,'vi')).map(([board,counts])=>({board, counts:gradeOrder.map(g=>counts.get(g)??0)}));
}

export type ReportFormat = 'xlsx' | 'docx' | 'pdf';
export function reportPath(format: ReportFormat, partner: string | null) {
  const params = new URLSearchParams({format});
  if (partner) params.set('partner',partner);
  return `/overview/export?${params}`;
}
export function reportMimeValid(format: ReportFormat, mime: string) {
  const expected: Record<ReportFormat,string> = {xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',pdf:'application/pdf'};
  const normalized=mime.toLowerCase().split(';')[0].trim();
  return normalized===expected[format] || normalized==='application/octet-stream' || normalized==='';
}
