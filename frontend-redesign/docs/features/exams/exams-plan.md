# Implementation plan V30–V32

## Baseline & reuse (source checked in V29 workspace)
| Existing | Use |
|---|---|
| `src/features/results/Exams.tsx` (return null), `routes.ts` (/diem-thi) | Replace placeholder only; route unchanged |
| `useWorkspace`, `useResource(path,{clearWhenDisabled:true})`, apiFile | Existing identity and request lifecycle |
| `PageRefresh` | Shell portal, exactly one page refresh |
| `ViewSwitch` | Two modes, existing ConnectedButtonGroup |
| `TextField variant="search"`, `WorkspaceSelect` compact | V29 controls, not generic form styling |
| `RecordTable`, `RecordList`, `WorkspacePagination` from DataWorkspace | caller owns column config, row keys, sort, paths |
| `ResponsiveDialog`, `CsvDownload`, `StatusLabel` | shared V28, native modal + safe portal policy, use correct props |
| `chip.tsx`, `checkbox.tsx`, `IconButton`, `Button` | existing interaction primitives |
| `Chart` + `theme.ts` + `responsive.ts` | existing Line/Bar registration; no new chart engine; HTML bars for other comparisons |
| `shared/format.ts` | numberText/percentText (preserve null and decimals) |

Before editing confirm actual APIs/prop types, baseline and docs. Shared fixes only if needed, regression Contacts/Leads/Overview, no wholesale imports from latest registry. No lockfile/deps changes. No backend, data, Shell, route or teammate feature diff.

## File structure
```
frontend-redesign/src/features/results/
  Exams.tsx
  exams/
    model.ts
    query.ts
    analytics.ts
    exams.css
    components/Filters.tsx
    components/Records.tsx
    components/CandidateDetail.tsx
    components/Analytics.tsx
frontend-redesign/scripts/test-exams.mjs
frontend-redesign/REDESIGN-V32-EXAMS.md
```
No unnecessary wrappers for shared components. Prefix feature CSS exm-* (avoid ex-* registry prefix). Add test:exams to test:local only consistent existing Node loader. Test model/query separately.

## State machine
1. Scope ready/identity → meta discovery scoped (candidate dataset requested URL or PM119). Validate echo. If no dataset show dedicated state; if invalid URL resolve first available (prefer PM119) with notice, clear dependent filters/search. Fetch options for resolved dataset before any data request. Ensure response path key belongs to exact dataset even though meta echo lacks dataset.
2. URL dataset/view/structural filters only. No PII q in URL/storage. Keep q draft/applied, debounce 300ms. Validate sort/size and filters; invalid values don't silently broaden data. Change dataset atomically reset structural filters, q, page, selected detail, export; preserve view if desired; close draft. Identity change reset same; no data from previous scope. Explicitly distinguish discovery state from options ready.
3. Query key includes dataset + effective partner + structural filters + applied q + list controls. Page resets on filter/q/sort/size change atomically, no one request with stale page. Out-of-range page after refresh clamp then request, no loop. Export abort on path/scope change; disabled if q pending/not ready/no rows/permission.
4. Only active list or summary request; lazy analytics. Filter chips use normalized labels/values. Drill-down exact supported field; preserve dataset, clear q, reset page, switch records. No fake round filter. Options retry + active retry on PageRefresh, keep snapshot same path, no stale scope.

## V30 — Records Workspace
- Confirm API/ETL contract; model/query pure tests, fixtures for linked/independent/null score/unknown values. Dataset discovery and switch state first. Build warning, filter dialog/chips, toolbar, records responsive, pagination, row detail and CSV. No dead view switch until analytics implemented. Policy: restricted export off until owner agrees masked CSV; document backend limits.
- Gate: 320/390/768/1280, scope with only A24, no datasets, invalid URL, two rapid dataset switches; search→filter→detail→CSV, missing final and ranks unchanged. Run baseline tests and full build if possible.

## V31 — Analysis Workspace
- KPI, dynamic parameter context, VL histogram, grade/section round selector, breakdown selector. Validate finite scores/counts, unknown bins and grades, null pct, empty groups. Chart theme and responsive host sizing; full table alternate; no individual names or paid correlation.
- Gate: fixture with missing score, tied ranks, missing metadata, threshold changed, final cohort smaller, unknown board/grade, zero/negative invalid inputs. No chart calculation that changes backend flags. Check drill-down exact keys and active resource.

## V32 — Product review
- Run exams-review.md; real FastAPI/MongoDB accounts (admin, scoped partner, DN restricted, absent module), real build/typecheck, five themes light/dark, keyboard/touch/zoom and dataset race. Static screenshots labelled fixture; record NOT RUN if deps unavailable. Fix P0/P1 before cosmetics.
- Regression Contacts/Leads/Overview, V29 primitives, no feature teammate changes. git diff --check; apply patch against clean V29. One code patch V29→V32, docs patch separate. Log commands, actual output and limitations; no remote push or user commits.
