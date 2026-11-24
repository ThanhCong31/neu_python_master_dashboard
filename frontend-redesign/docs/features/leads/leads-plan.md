# Kế hoạch V21–V23 — Lead từ biểu mẫu

## Baseline và giới hạn

Bắt đầu V20 thực tế. Workspace `/mnt/data/contacts-work` có V19 commit + V20 working diff; Leads.tsx return null. Kiểm tra lại GitHub/local baseline trước coding, không assume user đã commit V20. Read AGENTS/CONTRIBUTING, docs Contacts và V20. Không sửa route, Shell, backend, data, Marketing/Sponsorship/Exams. Docs-only ở vòng hiện tại. Không thêm dependencies. Nếu cần shared extraction, review diff và regression Contacts, không làm refactor rộng cho vui.

## Reuse map (đã đối chiếu source V20)

| Hiện có | Hướng |
|---|---|
| `src/shared/PageActions.tsx` | Dùng PageRefresh đúng slot Shell; busy từ options/active, disable khi dialog draft mở nếu cần |
| `src/services/useResource.ts` | useResource(path|null,{clearWhenDisabled:true}); same-path refresh giữ snapshot |
| `src/services/api.ts` | apiFile và abort, 401 xử lý tập trung |
| `contacts/model.ts`, `query.ts` | Tham khảo normalize, date validation, query builder, width tiers; KHÔNG import contact-specific groups/paths/sort/options vào Leads |
| `contacts/components/ExportCsv.tsx` | Filename hardcode lien_he.csv; có thể tách generic CsvDownload nhận path/filename/disabled, test abort và mime; nếu không đủ regression giữ riêng nhỏ |
| `contacts/components/Dialog.tsx` | Kiểm tra focus/scroll/portal, tách generic nếu hợp đồng props phù hợp; không copy mù CSS |
| `contacts/components/Filters.tsx`, Records.tsx | Pattern giống nhau, model khác; tách generic primitive filter draft/pager nếu thực sự dùng chung; không generic hóa cả feature |
| `src/shared/charts/Chart.tsx`, theme.ts, responsive.ts | ECharts, theme và host-width; không thêm engine, không dùng options của chart cũ |
| `src/shared/format.ts`, Expressive components | Reuse format và component API thật |

## Cấu trúc dự kiến

```
frontend-redesign/
  docs/leads/                       # hồ sơ này
  src/features/admissions/
    Leads.tsx                       # boundary, active resources + page refresh
    leads/
      model.ts                      # types / business invariants
      query.ts                      # filters, sorts, exact drill-down, paths
      analytics.ts                  # week helpers, grouping, count validation
      leads.css                     # ld-* container styles
      components/
        Filters.tsx
        Records.tsx
        LeadDetail.tsx
        ExportCsv.tsx                # hoặc generic shared nếu đã duyệt
        Analytics.tsx
  scripts/test-leads.mjs
  REDESIGN-V23-LEADS.md
```

Không tạo file nếu không có trách nhiệm thực. Không phụ thuộc Contacts CSS qua class ct-*; shared extraction có namespace riêng, giữ Contacts visual regression. Test script theo loader/version Node hiện tại; không tự đổi package scripts khi chưa cần. API query pure functions test độc lập.

## State & request

Scope ready + identity key → options scoped → validate applied filters → mode active → list/summary path. Identity gồm username, role, effective partner, can_view_pii. Không dùng partner từ URL. Khi đổi identity, đóng detail/dialog/export, reset filters/search/page và remount; không hiển thị snapshot cũ. Options echo phải khớp scope. structural filters + mode URL, q draft/applied memory, debounce 300 ms, page/sort/pageSize atomic, selection scoped theo snapshot. Filter invalid block request, cho clear. Summary không q. Export snapshot chính xác với list q applied, không sort/page. On mode change unmount/inactivate resource, không load chart ở records. PageRefresh refresh options + active, giữ mọi query state; không ETL.

## V21 — Records Workspace

1. Baseline inspect, run current tests/build nếu deps đủ; lưu input diff. Review privacy và API contract, model/query, fixtures; validate date/multi/scope/sort/PII.
2. Records route, filter draft dialog/chips, search count, table/list, sort/pager; responsive ngay từ đầu, same pattern Contacts. Use actual endpoints only.
3. Detail row + CSV có abort, exact query, correct filename, state/error, no fake controls. PageRefresh slot. Chỉ xuất hiện mode switch khi analytics thật đã triển khai, không ship dead tab.
4. Gate: task search→filter→detail→CSV ở 320/390/768/1280, không tràn ngang; options invalid, q pending, scope race; regression Contacts/V20. Nếu không runtime được, ghi NOT RUN, không gọi V21 nghiệm thu.

## V22 — Analytical Workspace

1. Add summary types, validation counts, ISO week helpers, source-result matrix có unknown, partial breakdown coverage, missing dates check.
2. KPI 2 trọng tâm, kết quả đối soát, weekly chart/table, dimension selector, interest/self declaration phụ. Theme/responsive V16, no fixed palette, no repeated charts.
3. Drill-down exact dimension with allowed filter; source-result combined khi khả thi. No cross-route exact fake. Preserve filter, clear q, reset page; aria label action, no chart-only interaction.
4. Gate: fixtures missing/unknown/multi-year/empty, stacked totals đúng, weekly date semantics, source labels thật; 320/390/600/768/1280 and chart host thresholds; chart only active; theme change.

## V23 — Product review / refinement

Full review theo leads-review.md. Fix P0/P1 trước cosmetic. Check actual app with FastAPI/MongoDB, masked/admin/partner accounts, slow/error/scope race, 5 themes and mode, zoom/keyboard/touch. Review screenshot synthetic only; if runtime unavailable record evidence limits. Verify Contacts, Overview, Shell, no teammate diff, no data file. `git apply --check` against clean V20, whitespace, test scripts, tsc/Vite if possible. Deliver one patch V20→V23 + review log (commands and result, NOT RUN). No push/commit on user's repo. If user wants docs first, separate docs-only patch. Do not include docs twice if user already applied.

## Definition of done

Functional tasks complete, no unsupported actions, count semantics correct, PII limitations disclosed, no stale scopes, no responsive overflow, theme consistency, test evidence. Full build and real API integration are required for release acceptance; static source/layout checks only provisional. Backlog backend separate: explicit exact contact lookup, privacy policy question/export, CSV formula safety, timestamp provenance, stable lead ID, consistent source naming. No scope creep into Exams or backend this round.
