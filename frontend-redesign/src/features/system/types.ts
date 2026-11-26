/** Wire contracts from backend/app/routers/admin.py and backend/app/routers/misc.py (main). */
export interface AdminUser {
  username: string;
  full_name: string;
  role: "admin" | "partner";
  partner_code: string | null;
  active: boolean;
  created_at: string;
  last_login: string | null;
}
export interface Partner {
  code: string;
  name: string;
  type: string;
  description: string;
  scope_rule: string;
  modules: string[];
  can_view_pii: boolean;
  can_export_reports: boolean;
  data_scope?: {school_ids: string[]; contact_ids: string[]};
  active: boolean;
  default_username?: string;
  users: number;
  records: Record<string, number>;
}
export interface PartnersResult {
  partners: Partner[];
  modules: Record<string, string>;
}
export interface AuditEvent {
  at: string;
  action: string;
  username: string | null;
  ok: boolean;
  ip: string | null;
  detail: Record<string, unknown>;
}
export interface DataCounts {
  contacts: number;
  signups: number;
  leads: number;
  exam_candidates: number;
  exam_scores: number;
}
export interface ImportRun {
  started_at?: string;
  finished_at?: string;
  ok: boolean;
  files?: Array<{ name: string; sha256: string; size: number }>;
  checks?: Array<{ check: string; actual: unknown; expected: unknown; ok: boolean }>;
}
export interface QualitySummary {
  /** pipeline is GLOBAL, irrespective of query partner; never present as scoped partner KPI. */
  pipeline: {
    raw_counts: Record<string, number>;
    total_raw: number;
    unique_contacts: number;
    merged_records: number;
    duplicate_rate: number;
  } | null;
  by_issue: Array<{ issue: string; source: string; count: number }>;
  by_reason: Array<{ reason: string; source: string; count: number }>;
  flags: Array<{ key: string; count: number }>;
  merged_distribution: Array<{ merged: number; count: number }>;
  /** last_import is GLOBAL, not partner scoped. */
  last_import: ImportRun | null;
}
export type QualityRow = Record<string, unknown>;
export interface QualityList { total: number; rows: QualityRow[] }
