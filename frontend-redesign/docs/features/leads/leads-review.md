# Review guide — V21–V23

Trạng thái: kế hoạch test, **tất cả NOT RUN** tại bước thiết kế. Đánh dấu PASS chỉ khi có command/log hoặc observation thực; FAIL nếu lỗi, BLOCKED nếu thiếu API/deps/account. Screenshot tĩnh không thay full React/ECharts runtime. Không dùng PII thật trong fixture/screenshot/log.

## Fixtures nghiệp vụ (synthetic)

| row | source | row_no | contact_id | result | created_at UTC |
|---|---|---:|---|---|---|
| A | Talkshow | 2 | PT-001 | Lead mới | 2026-12-31T10:00Z |
| B | FB Lead Form | 2 | PT-001 | Trùng trong form ngoài | 2027-01-01T12:00Z |
| C | FB Lead Form | 3 | PT-002 | Đã có trong Data | 2027-01-04T08:00Z |
| D | Talkshow Google Form | 4 | PT-003 | Kết quả khác | null |
| E | Talkshow | 5 | null | null | 2027-01-18T08:00Z |

Expect total=5, unique_contacts=3, new=1/in_data=1/dup=1/other or missing=2. total-unique=2 is NOT confirmed duplicate count. Week 2026-W53 has 2; 2027-W01 has 1; W02 zero if filled; W03 has 1. Undated 1. start for W53 is Dec31 or Jan1 per source, Monday is Dec28. Source alias strings remain separate API values; never merge implicitly. Missing result retained. Fixture includes source row_no collision and same contact_id; selection stays correct. Add second fixture empty total=0, partial by_campaign (2 counts), PIC null/empty, campaign sentinel, Unicode comma option, long Vietnamese text, invalid negative counts and unique>total; label no data and reject invalid chart. Do not replace backend summary with fixture in prod.

## Functional checklist

| ID | Test / acceptance | Gate |
|---|---|---|
| F01 | Default /lead opens list; no summary fetch or chart mount; Shell H1 unique | V21 |
| F02 | List count is dòng lead, duplicate contact_id rows remain distinct | V21 |
| F03 | Search mã/tên/email, 80 chars, debounce, reset page without old-page request | V21 |
| F04 | All 9 filter groups work; date inclusive and open ends, invalid calendar blocked | V21 |
| F05 | No hardcoded Aug/Sep; options no date bounds; valid outside old period accepted | V21 |
| F06 | Multi select OR group/AND across, Unicode encoding; no silent comma split | V21 |
| F07 | Filter draft cancel no query; Apply once; remove chip and clear restore expected state | V21 |
| F08 | Options loading/error/empty/unknown scope, retry and invalid filter correction | V21 |
| F09 | Sort all 7 backend fields; unsupported fields unavailable; mobile same capabilities | V21 |
| F10 | Page size reset; page count 0/1/last; refresh decreases total clamp once | V21 |
| F11 | Columns toggle/reset; identity/detail always accessible; state survives layout switch | V21 |
| F12 | Detail correct row when same contact ID or missing source/row_no, null fields clear | V21 |
| F13 | Detail labels self-declared vs verified, wants_talkshow false vs missing | V21 |
| F14 | CSV same filters/q and scope, no page/sort; filename; all matching rows; disclose ascending date | V21 |
| F15 | CSV pending/error/mime/empty, duplicate click disabled, no claim disk save | V21 |
| F16 | PageRefresh one in Shell; updates options + active view, preserves page/sort/q | V21 |
| F17 | Same path refresh fail retains data w warning; different path not show stale | V21 |
| F18 | URL back/forward structural filters/mode, no PII q in URL | V22 |
| F19 | Switch mode retains structural filters, search note, summary excludes q, hidden list disabled | V22 |
| F20 | KPIs from backend, unknown result shown, no false conversion, total=0 safe | V22 |
| F21 | ISO weeks across year boundary and W53; min(start) not used as Monday | V22 |
| F22 | Missing weeks 0 only within known span; undated difference; long range safe, all table data | V22 |
| F23 | Source-result matrix unknown/null, totals match, no invalid negative/missing count coercion | V22 |
| F24 | Dimension selector correct fields/labels, partial denominator, top-N disclosure and full table | V22 |
| F25 | Exact drill-down only mapping allowed; filter intersect, clear q/page, no fake heard_from filter | V22 |
| F26 | Chart/table toggle, tooltips and legend data/units, table accessible keyboard | V22 |
| F27 | No question aggregate, no CRM payment/ROI/funnel duplication, no fake write buttons | V23 |
| F28 | All loading/error/empty states in real app, no unrelated layout shift | V23 |

## Privacy, authorization, race

| ID | Acceptance |
|---|---|
| S01 | Admin all→partner A→B rapid switch; no old rows/detail/options/export visible or downloadable after switch |
| S02 | Partner account ignores crafted partner URL; backend access and 403 tested, not just hidden nav |
| S03 | Role/identity/can_view_pii change remount boundary; no cache old account |
| S04 | Masked email/phone preserved, note hidden, question not displayed in detail for masked role; no raw fields reconstructed |
| S05 | CSV backend question exposure and formula injection documented and reviewed before production; no assertion CSV fully sanitized |
| S06 | q stays memory; no PII in URL/localStorage/logs/analytics; regex email inference risk documented |
| S07 | Pending CSV abort on query/scope/mode/unmount, stale blob no download |
| S08 | Out-of-order API response abort, no scope-old data on new path; same-path failure notice only |
| S09 | 401 session-expired, 403 clear permission, 400/422 validation; no infinite retry |
| S10 | Refresh/read calls GET only, no ETL/edit, source text rendered escaped not HTML |

## Responsive matrix

Run actual React + CSS + ECharts where possible. At each width both modes, filter/dialog, long names, error/empty, pager and export. Viewport 320, 360, 390, 430, 600, 768, 1024, 1280, 1440, 1920; content breakpoints 679/680/999/1000; chart 339/340/479/480/679/680. Test sidebar open/closed, scroll, 200% zoom, long scope label. Mobile touch, keyboard Tab/Shift+Tab/Esc/Enter, reduced motion. Five actual theme palettes × light/dark/system, change while chart mounted.

| ID | Acceptance |
|---|---|
| R01 | Body no horizontal overflow; essential workflow never requires horizontal scroll |
| R02 | Compact list below 680; same rows/actions/sort/pager, optional data in detail |
| R03 | Desktop table aligned numeric/date cells, sort focus and aria-sort, optional columns only local scroll |
| R04 | Long name/source/campaign/unknown result/ID wrap or accessible truncation; action not obscured |
| R05 | Filter chips wrap, clear remains visible; search full width on small host |
| R06 | Dialog fullscreen compact, desktop capped; scroll body and persistent close/apply, no trapped page scroll |
| R07 | Focus restored on close, no invisible focus targets at layout change; keyboard operable |
| R08 | ≥44px touch controls, prefer 48; clear and pager target spacing |
| R09 | Only Shell title and refresh; scope moves as V20, long title wraps |
| R10 | Charts resize by host, tick/legend readable, no data point removal; tooltip contained |
| R11 | Many sources or categories switch table-first/top-N with full table, no enormous legend |
| R12 | Theme colors from current tokens; text, chart label contrast; no color-only status |
| R13 | No clipping at 200% zoom, mobile browser viewport/dynamic height; scroll restoration sensible |
| R14 | Reduced motion no forced spinner/shape effects, skeleton status announced reasonably |
| R15 | No chart instance while list active; chart dispose/resize lifecycle verified |

## Design rubric (0 fail, 1 acceptable, 2 strong)

1. Task priority list first, no unnecessary KPI above rows.
2. IA consistent with Contacts without duplicate business functions.
3. PageActions V20 and no extra title/header.
4. Material expressive hierarchy, coherent shape/typography/spacing.
5. Controls clearly state selected/draft/disabled/loading, no dead action.
6. Responsive workbench, not shrunk desktop; long values readable.
7. Data meaning explicit (row vs distinct, matching vs conversion, timezone).
8. Chart/table semantics and theme consistency, legend accessibility.
9. PII minimized, scope boundaries, no false exact lookup.
10. Maintainable boundaries, no unnecessary duplication or broad shared refactor.

Target ≥17/20, no zero; P0/P1 and security failures block release even if rubric passes. Record evidence for each; subjective rubric does not replace tests.

## Commands and release record template

From V20 workspace: inspect git status/diff, confirm actual Node version/package scripts. Run `node --experimental-strip-types scripts/test-leads.mjs` when script exists and supported; `node --experimental-strip-types scripts/test-contacts.mjs`, `npm run test:local`, `npm run build`, `npm run dev`. If scripts differ use actual package commands. Real FastAPI/MongoDB, test accounts, no reset seed on user DB without authorization. Verify patch `git apply --check` on clean baseline, `git diff --check`, scope file list. Attach log and exact env; full build/live runtime NOT RUN if deps unavailable. Record version, baseline SHA or patch, commands, PASS/FAIL/NOT RUN, open issues, screenshots synthetic, reviewer decision. No automatic push.
