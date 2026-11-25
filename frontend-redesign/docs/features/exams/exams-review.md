# Review guide — V30–V32

All items planned, NOT RUN during research. Record PASS/FAIL/NOT RUN + command/device/screenshot or actual response evidence, no fabricated pass. Use synthetic fixtures only in tests, never real PII in screenshot exports. Full runtime required for release.

## A. Functional acceptance
- [ ] First load PM119 if scoped; else first available dataset, meta label from server.
- [ ] Scope only A24 or B95; no list request for PM119 if unavailable.
- [ ] No datasets: dedicated empty + retry; no invalid requests or fake charts.
- [ ] Invalid/missing dataset URL: deterministic recovery with notice, not broadening scope.
- [ ] Changing dataset resets dependent filters, q, page, detail and export; view preserved per design.
- [ ] Reset filters retains dataset; search clear does not reset dataset.
- [ ] 9 filter groups accessible; OR/AND semantics; true/false/absent preserved.
- [ ] Grade means qualifier; advanced means flag, not final presence; paid wording accurate.
- [ ] Draft apply one query, cancel no request, options no stale selections.
- [ ] Unknown/malformed values, comma values handled visibly; no silent broadening.
- [ ] Search Unicode, regex characters, trim/80 chars, debounce; list/CSV only.
- [ ] Sort allowlist only, rank label in-board; final rank not sortable server-side.
- [ ] Page/size reset and clamp after shrink; zero total no pager illusion.
- [ ] Column selection optional; required fields retained; no unsupported controls.
- [ ] Missing score vs zero; fractional score not mislabelled; null flag vs false.
- [ ] Candidate detail from row, both rounds, board and dataset; tied ranks kept.
- [ ] Missing final advanced true/false and inconsistent final/advanced states explained.
- [ ] Independent dataset null contact_id doesn't cause key collisions or false CRM link.
- [ ] CSV exact applied filters + q, no sort/page, fixed order, valid filename, warning.
- [ ] Restricted export disabled under proposed policy; backend limitation disclosed.
- [ ] Single PageRefresh; reload options + active view, preserve same-path controls.
- [ ] Mode toggle selected state, no duplicate refresh/title; no inactive summary/list calls.
- [ ] KPI count means records, mean ignores missing, cert_rate denominator all records.
- [ ] Histogram correct bins and coverage; no final histogram fabricated.
- [ ] Grade shares count classified rows; unknown grades preserved.
- [ ] Sections missing denominator no percentage; compare within selected round, explicit sample context.
- [ ] Breakdown full table, top-N chart labelled, null average not zero.
- [ ] Drill-down supported filter only; dataset preserved; search cleared, page reset.
- [ ] Simulated notice always present, including detail/export confirmation; no official ranking language.

## B. Scope, privacy and race
- [ ] Nonadmin partner URL ignored; use backend effective scope.
- [ ] Scope identity changes during meta/list/summary/export; stale response never displayed/downloaded.
- [ ] Rapid dataset A→B→A; validate path keys, not just echo partner.
- [ ] Filter change while options refresh; no invalid dataset request.
- [ ] 401 returns login; 403 clear actionable error, no leaked previous rows.
- [ ] Same path refresh fails: old data labelled, retry works; new path failure no stale snapshot.
- [ ] q pending blocks CSV; abort on query/scope change/unmount.
- [ ] Restricted account can export scoped CSV; email uses API-masked values, finalist names/schools follow original visibility. Verify server masking, including malformed email, separately; no raw PII in logs/storage.
- [ ] Names in finalists summary not rendered as chart labels or tables; no fake anonymization claim.
- [ ] CSV formula injection/back-end risk recorded; confirm restricted policy with owner before release.
- [ ] Account without exams module cannot enter; module authorization backend independent of navigation.

## C. Business fixtures
| Fixture | Expected |
|---|---|
| dataset PM119/Bảng A scores 900,900,700; filter removes first two | hạng 1,1,3 as stored; remaining rank 3, not 1 |
| A24 stt=1, B95 stt=1, contact_id=null | distinct context keys; no merge across datasets |
| VL=590, CK=620, certificate=true | cert true even though VL below threshold, grade separate |
| VL=0, CK=null | display 0 and dash; not equal |
| advanced=true, final=null | qualified, no final score |
| advanced=false, final.total=650 | flag inconsistency visible, don't recompute |
| kpi.count=5, histogram counts=3, avg=640 | 5 matched candidates, 3 in histogram; avg not total/5 |
| params threshold=700, top_ratio=.15 | dynamic text 700, 15%; no hardcoded 600 or 10 |
| params={}, section.max_score=null | no invented thresholds or ratio |
| grades known 3 + unknown 1, count=6 | denominator classified 4; unknown visible, coverage note |
| histogram bin 0/1/9 plus -1 | [0,100), [100,200), >=900; negative anomaly not silently dropped |
| final_by_board certificates=1, global certificate=3 | don't substitute final-only count |
| school count=20, avg=null, box=null | count matched 20, avg dash, no score bar |
| URL school with comma | error or disabled option, no broadened query |
| metadata dataset list empty, summary.datasets nonempty | no selection from unscoped summary |

## D. Responsive, M3, accessibility
Matrix viewport 320/360/390/430/600/768/1024/1280/1440/1920, sidebar expanded/collapsed; content 679/680/999/1000 and chart host 339/340/479/480. All 5 actual theme presets × light/dark (system mode switch), zoom 200%, keyboard only, reduced motion, touch, long Vietnamese/English labels. Include scoped restricted and empty/error.
- [ ] No page horizontal scroll; optional expanded table local scroll only, default fits.
- [ ] Warning and dataset context visible, label wraps, no clipped popup/overlap.
- [ ] V29 search pill 48px, compact select 48px/radius16, toolbar aligned/wrap, font consistent; default login/admin unaffected.
- [ ] ViewSwitch uses connected geometry, check and active text contrast, no width shift.
- [ ] Filter chips removable separately, wrap, touch targets >=48; native modal portal safe.
- [ ] Table headers scope/aria-sort, keyboard focus, numeric alignment, detail icon label.
- [ ] RecordList retains board/VL/CK/certificate and detail action; no lost fields.
- [ ] Dialog full-screen compact, scroll body, close/Escape/focus return, footer not hidden by viewport/keyboard.
- [ ] Pager buttons disabled appropriately, size control accessible, long counts wrap.
- [ ] Charts resize with container, no clipped labels, all bins kept, full table alternate.
- [ ] Theme colors update charts/controls; contrast and text labels, not color-only status.
- [ ] Tooltip touch, confined; no hidden truncated points; keyboard accessible data table.
- [ ] Reduced motion, no bounce/layout shifts; loading/errors announced, no fake counts.
- [ ] Check actual runtime with DevTools network: no redundant requests on render/theme/resize.

## E. Regression and release
Run from frontend-redesign: `npm run build`, `npm run test:local` (include test:exams), `npm run dev`. Test actual scoped responses on local backend; no seed overwrite for review. Check Overview chart mode/export, Contacts/Leads filters/pager/detail/CSV, Shell scope/refresh, Login/Admin field layout. `git diff --check` and `git apply --check` patch on clean baseline. No dependencies/lockfile or backend modifications. Review rubric (0–2 each): IA, semantic accuracy, responsive, M3 consistency, interaction, accessibility, performance, maintainability, privacy, evidence. Require no zero, no unresolved P0/P1, real build/integration pass; otherwise provisional. Log limitations and remediation, not blanket “done”.
