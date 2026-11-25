# IA / Visual Design — Kết quả thi

Proposed for review, not implementation. Design-system baseline V29. Purpose: tra cứu kết quả mô phỏng và phân tích phân bố, không tuyển chọn cá nhân hay công bố kết quả. Shell V20 title `Kết quả thi` và PageRefresh; no duplicate title, no new nav. Keep `/diem-thi`.

## IA
- Persistent top: small, visible semantic warning “Dữ liệu điểm giả lập — không dùng để công bố hoặc đánh giá cá nhân.” No dismiss; not giant red banner. Use token-based surface and readable text, no excessive badge.
- Dataset context as compact Select V29, label “Bộ dữ liệu”, dynamic label from scoped options, code and linked/independent description below if useful. Not chip inside filter. One selected dataset. Never use literal 119 as actual count.
- ViewSwitch V28/29: “Bảng điểm” / “Phân tích kết quả”. Default Bảng điểm. Filter button + InputChip applied conditions + clear filters. Dataset remains after clear. No repeated page heading/refresh.
- No global round selector in V30: qualifier + final columns, detail shows both. Analysis has round-specific grade/section selector ONLY for facets that support both; histogram explicitly qualifier, no fake final cohort. `advanced` filter labelled 'Vào chung kết' (not “Có điểm CK”).
- Both modes share structural filters. List search is separate, explicitly described; no summary fetch while in records; lazy analytics.

## Records — priority
Default table columns: `Thí sinh` (name + STT/contact_id secondary), `Bảng`, `Điểm VL` (rank + grade secondary when space), `Điểm CK` (dash when null), `Chứng chỉ` (text status), row detail icon. On medium move grade into detail if needed; keep essential qualifier/final and board; no sticky columns that obscure content. Rank in-board label clear, avoid medals or hero names. Default sort -qualifier.total. Optional columns: school, province, school_type, contact_id if linked, email as returned by API (masked according to backend policy), payment, rank VL, grade VL, best score, advanced and section fields only where useful. No sort on unsupported keys. Column menu doesn't change export fields. Optional columns may create local horizontal scroll; default must fit.
Toolbar: TextField variant=search, WorkspaceSelect compact “Sắp xếp”, Cột button, CsvDownload. Search placeholder “Tìm tên, mã, email, trường”; accessible label; 300ms debounce. Sort choices supported by API, clear direction labels. No repeated helper text occupying toolbar, short note below. Empty no filters: 'Chưa có thí sinh trong bộ dữ liệu này'; with filters: clear filter/search action; no fake page or count while loading. Pager near count and page-size using shared WorkspacePagination.

Detail: shared ResponsiveDialog, title name or “Thí sinh · STT …”, visible simulated label. Header dataset/board; info section school, province, contact id, email as returned by API. Two round panels, each level,total,rank within board,grade, sections with null dash. If final absent and advanced true: 'Đã vào chung kết · Chưa có điểm chung kết'; if advanced false no final: 'Không ghi nhận điểm chung kết' (no infer absence/participation), if final present but advanced false display flag inconsistency note. Certificate flag and best score separate. No certificate issuance/download, no edit, no navigation to unverified record. Close focus restore. Max scores only when known; do not fetch heavy summary in records. V67 follows backend field visibility and module access; no raw score or PII in external tools.

## Analytics — four compact areas
1. KPI composition: hero “Thí sinh trong phạm vi”, avg VL (mean of non-null score), “Vào chung kết” (advanced), “Đạt ngưỡng chứng chỉ” (certificates, cert_rate). Max/min and avg CK as secondary stats if valid. Count and average never conflate. Dynamic rule info in small details panel: grade thresholds and top_ratio if provided, rank within board; not official certification.
2. Histogram VL (ECharts Bar) by board, 10 bins server semantics, label 0–<100 etc., >=900 final. Keep zeros for existing board categories, not missing as false zero. Chart/table toggle accessible; total grouped coverage note vs count. No exact threshold line inside bin when threshold ambiguous. Preserve all bins at resize, sample labels only.
3. Grade / section analysis: one round selector scoped here. Grade composition counts by board with labeled totals; percentage of classified entries, unknown grade appended. Section means normalized by max score from metadata, display avg/max and pct, no ranking of individuals. Prefer HTML bars + tables for small sets; no new ECharts types unless required. Unknown/max absent => no percent; not 0.
4. Breakdown: dimension board/school/school_type/province/region; mean VL bar or table, count, certificates, finalists. Show full table, optionally first 8–10 groups by count on chart with explicit truncation label; avoid 'best schools' ranking. Nullable avg not zero. Group filter drill-down only exact supported field and valid option, preserve others; null/commas no action. Do not default paid comparison, scatter individual names, boxplot or standalone repetitive charts; retain backend available, future use only justified.

## Wireframe (desktop)
```
[Shell: Kết quả thi                       Scope      Refresh]
[ⓘ Dữ liệu giả lập — không dùng để công bố/đánh giá cá nhân]
Bộ dữ liệu [119 thí sinh (liên kết CRM) ▼]
[Bảng điểm][Phân tích kết quả]       [Bộ lọc] [applied chips]
┌ Danh sách thí sinh                         N thí sinh ┐
│ (⌕ Tìm kiếm…)  Sắp xếp [Điểm VL ↓] [Cột] [Xuất CSV] │
│ Thí sinh   Bảng    Điểm VL    Điểm CK   Chứng chỉ    › │
│ …                                                       │
│ 1–20/N                  Số dòng [20]        ‹ 1/n ›    │
└─────────────────────────────────────────────────────────┘
```
Mobile: warning wraps; dataset label/trigger full width; ViewSwitch two balanced controls, no outer container; filter chips wrap; search full width, sort/export wrap. Below 680 content width use RecordList: name+ID, board, VL/CK labelled with missing dash, certificate and detail. No hidden functional content at 320px.

## V29 visual spec
- Theme roles only; Inter Variable; no hardcoded colors. Use shared StatusLabel (text conveys status; neutral for missing). Compact controls 48px, search pill, select radius 16px, 12px toolbar gap, standard motion. Reuse current popup behavior, no Base UI portal inside native modal (use existing native checkbox/date/select pattern if needed).
- Data surface large radius from tokens; avoid card inside card for every score. Row height comfortable min 52, touch target >=48, focus visible. Table header sort has aria-sort. Number alignment tabular, 1–2 decimal digits where necessary; don't round a noninteger score into different threshold class.
- Content width tiers <680 list, 680–999 essential columns, >=1000 optional defaults only if fit. At 320 viewport and zoom 200% controls wrap, no viewport horizontal scroll, no clipping. Dialog full-screen compact, sticky header/footer, body scroll. Chart host tier <480 uses compact axes/legend, tooltip confined, chart alternate table always reachable. No graph canvas for empty/missing; reduced motion.
- One refresh in Shell: options + currently active resource, retain same-path data, refreshError inline. Disable while draft dialog open where relevant; no global mutations. On changing dataset/partner close details/export, clear stale content before fetch.
